import { svgNs, creator, maintainer, destroyer } from '../svg-nodes';

describe('svg-nodes', () => {
  it('should have the correct svg namespace', () => {
    expect(svgNs).to.equal('http://www.w3.org/2000/svg');
  });

  describe('creator', () => {
    it('should throw error when type is invalid', () => {
      expect(creator).to.throw(Error);
    });

    it('should create an element and append it to the parent', () => {
      const p = {
        ownerDocument: {
          createElementNS: sinon.stub().returns('candy'),
        },
        appendChild: sinon.spy(),
      };

      creator('magic', p);
      expect(p.ownerDocument.createElementNS).to.have.been.calledWithExactly(svgNs, 'magic');
      expect(p.appendChild).to.have.been.calledWithExactly('candy');
    });

    it('should return the created element', () => {
      const p = {
        ownerDocument: {
          createElementNS: sinon.stub().returns('candy'),
        },
        appendChild: sinon.spy(),
      };

      expect(creator('magic', p)).to.equal('candy');
    });

    it('should create a group element for type container', () => {
      const p = {
        ownerDocument: {
          createElementNS: sinon.stub().returns('candy'),
        },
        appendChild: sinon.spy(),
      };

      creator('container', p);
      expect(p.ownerDocument.createElementNS).to.have.been.calledWithExactly(svgNs, 'g');
    });
  });

  describe('destroyer', () => {
    it('should remove node from parent', () => {
      const el = {
        parentNode: {
          removeChild: sinon.spy(),
        },
      };
      destroyer(el);
      expect(el.parentNode.removeChild).to.have.been.calledWithExactly(el);
    });

    it('should not throw error if parentNode is falsy', () => {
      const fn = () => {
        destroyer({});
      };
      expect(fn).to.not.throw();
    });
  });

  describe('maintainer', () => {
    it('should apply given attributes', () => {
      const el = {
        setAttribute: sinon.spy(),
      };
      const item = {
        attrs: {
          cx: 13,
          fill: 'red',
        },
      };
      maintainer(el, item);
      expect(el.setAttribute.firstCall).to.have.been.calledWithExactly('cx', 13);
      expect(el.setAttribute.secondCall).to.have.been.calledWithExactly('fill', 'red');
    });

    it('should always append whites-space attribute to text nodes', () => {
      const el = {
        setAttribute: sinon.spy(),
      };
      const item = {
        attrs: {
          text: 'Hello',
        },
      };
      maintainer(el, item);
      expect(el.setAttribute.firstCall).to.have.been.calledWithExactly('style', 'white-space: pre');
    });

    it('should ignore attributes id, type, children, and complex data objects', () => {
      const el = {
        setAttribute: sinon.spy(),
      };
      const item = {
        id: 'a',
        data: {},
        type: 'a',
        children: 'a',
      };
      maintainer(el, item);
      expect(el.setAttribute.callCount).to.equal(0);
    });

    it('should set data attribute if data value is a primitive', () => {
      const el = {
        setAttribute: sinon.spy(),
      };
      const item = {
        data: 'foo',
      };
      maintainer(el, item);
      expect(el.setAttribute).to.have.been.calledWith('data', 'foo');
    });

    it('should set data attributes if data object contains primitives', () => {
      const el = {
        setAttribute: sinon.spy(),
      };
      const item = {
        data: {
          x: 123,
          label: 'etikett',
          really: true,
          complex: {},
        },
      };
      maintainer(el, item);
      expect(el.setAttribute.callCount).to.equal(3);
      expect(el.setAttribute.getCall(0)).to.have.been.calledWith('data-x', 123);
      expect(el.setAttribute.getCall(1)).to.have.been.calledWith('data-label', 'etikett');
      expect(el.setAttribute.getCall(2)).to.have.been.calledWith('data-really', true);
    });

    it('should always append dy attribute on text item', () => {
      const el = {
        setAttribute: sinon.spy(),
        getAttribute: () => 5,
      };
      const item = {
        type: 'text',
        attrs: {
          dy: 10,
          x: 0,
          y: 0,
        },
      };
      maintainer(el, item);

      expect(el.setAttribute.args[0]).to.deep.equal(['dy', 15]);
    });

    it('should transform dominant-baseline into dy attribute on text item', () => {
      const el = {
        setAttribute: sinon.spy(),
        getAttribute: () => 5,
      };
      const item = {
        type: 'text',
        attrs: {
          'dominant-baseline': 'ideographic',
          'font-size': '10px',
          x: 0,
          y: 0,
        },
      };
      maintainer(el, item);

      expect(el.setAttribute.args[0]).to.deep.equal(['dy', 3]);
    });

    it('should append a title element on text item with the title attribute', () => {
      const titleElm = {};
      const el = {
        setAttribute: sinon.spy(),
        getAttribute: () => 5,
        ownerDocument: {
          createElementNS: () => titleElm,
        },
        appendChild: sinon.spy(),
      };
      const item = {
        type: 'text',
        attrs: {
          title: 'my title',
          x: 0,
          y: 0,
        },
      };
      maintainer(el, item);

      expect(el.appendChild).to.have.been.calledWith(titleElm);
      expect(titleElm.textContent).to.equal('my title');
    });

    describe('should ignore item with "NaN" attributes', () => {
      let el;
      let circle;
      let rect;
      let line;
      let text;

      beforeEach(() => {
        el = {
          setAttribute: sinon.spy(),
        };

        circle = {
          type: 'circle',
          attrs: { cx: 1, cy: 1, r: 1 },
        };

        rect = {
          type: 'rect',
          attrs: { x: 1, y: 1, width: 1, height: 1 },
        };

        line = {
          type: 'line',
          attrs: { x1: 1, y1: 1, x2: 1, y2: 1 },
        };

        text = {
          type: 'text',
          attrs: { x: 1, y: 1 },
        };
      });

      ['cx', 'cy', 'r'].forEach((attr) => {
        it(`circle - ${attr}`, () => {
          circle.attrs[attr] = NaN;

          maintainer(el, circle);
          expect(el.setAttribute).to.not.have.been.called;
        });
      });

      ['x', 'y', 'width', 'height'].forEach((attr) => {
        it(`rect - ${attr}`, () => {
          rect.attrs[attr] = NaN;

          maintainer(el, rect);
          expect(el.setAttribute).to.not.have.been.called;
        });
      });

      ['x1', 'y1', 'x2', 'y2'].forEach((attr) => {
        it(`line - ${attr}`, () => {
          line.attrs[attr] = NaN;

          maintainer(el, line);
          expect(el.setAttribute).to.not.have.been.called;
        });
      });

      ['x', 'y'].forEach((attr) => {
        it(`text - ${attr}`, () => {
          text.attrs[attr] = NaN;

          maintainer(el, text);
          expect(el.setAttribute).to.not.have.been.called;
        });
      });
    });
  });
});
