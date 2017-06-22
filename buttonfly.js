(function () {
  var ButtonFly = function (element, options) {
    var _this = this;

    // Sanity assertions.
    if (_this === window) {
      console.error("ButtonFly is a class constructor, can't call it without 'new'!");
      return;
    }
    if (element.children.length < 1) {
      console.error("ButtonFly element has no children. At least one child is required.");
      return;
    }

    // Construct options object.
    this.options = {};
    for (var key in ButtonFly.defaultOptions) {
      if (ButtonFly.defaultOptions.hasOwnProperty(key)) {
        this.options[key] = ButtonFly.defaultOptions[key];
      }
    }
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        this.options[key] = options[key];
      }
    }

    // Update and save button elements.
    _this.element = element;
    _this.element.classList.add("buttonfly");
    if (!_this.options.initiallyShown) _this.element.classList.add("buttonfly--hidden");
    if (_this.options.onlyWrapMainButton) _this.element.classList.add("buttonfly--only-wrap-main");

    _this.mainButton = _this.element.children[0];
    _this.mainButton.classList.add("buttonfly__button");
    _this.mainButton.classList.add("buttonfly__button--main");
    _this.mainButton.addEventListener('click', function () {
      if (_this.options.toggleOnMainButton) _this.toggle();
    });

    _this.childButtons = Array.prototype.slice.call(_this.element.children, 1);
    _this.childButtons.forEach(function (btn, index) {
      btn.classList.add("buttonfly__button");
      btn.classList.add("buttonfly__button--child");
      btn.classList.add("buttonfly__button--var" + _this.variationForButton(index));

      btn.style.transitionDuration = _this.options.transitionDuration + 's';
    });

    _this.wrap = document.createElement('div');
    _this.wrap.classList.add("buttonfly__wrap");
    _this.element.append(_this.wrap);

    // Split elements into rows.
    _this.rowElements = {};
    _this.getOrCreateRowElement(0).append(this.mainButton);
    _this.childButtons.forEach(function (btn, index) {
      var rowNumber = ButtonFly.rowForButton(index);
      var rowElem = _this.getOrCreateRowElement(rowNumber);
      rowElem.append(btn);
    });

    // 3d effect.
    document.addEventListener('mousemove', function (e) {
      if (_this.isShown() && _this.options.hover3dEffect) {
        _this.set3dRotation(e.clientX, e.clientY);
      } else {
        _this.reset3dRotation();
      }
    });

    // Main button wrapping.
    window.addEventListener('resize', function (e) {
      if (!_this.options.onlyWrapMainButton) return;
      _this.updateMainButtonWrap();
    });
    if (_this.options.onlyWrapMainButton) {
      _this.updateMainButtonWrap();
    }
  };

  ButtonFly.defaultOptions = {
    initiallyShown: false,
    onlyWrapMainButton: false,
    rowLeftMarginStep: 24,
    transitionDuration: 0.15,
    transitionDelay: 0.05,
    toggleOnMainButton: true,
    buttonsVariations: 4,
    hover3dEffect: false,
    rotationPixPerDeg: 50,
    rotationMaxX: 20,
    rotationMaxY: 20,
    perspective: 1000,
  };

  ButtonFly.rowForButton = function (index) {
    return ButtonFly.posForButton(index).row;
  }

  /// Returns a row number for button with given index and its position in the row.
  /// Button with index 0 - is the first child button in the element
  /// (excluding the main button).
  ///
  /// Rows are numbers from the middle in both directions. Middle row is 0,
  /// top rows have positive numbers, bottom rows have negative numbers.
  /// Like so:
  ///
  /// Row 2
  /// Row 1
  /// Row 0 (middle)
  /// Row -1
  /// Row -2
  ButtonFly.posForButton = function (index) {
    var row, pos;

    if (index < 8) {
      // First three rows (top, middle, bottom) are filled.
      if (index % 3 == 0) {
        // First top row.
        row = 1;
        pos = Math.floor(index/3);
      } else if (index % 3 == 1) {
        // First button row.
        row = -1;
        pos = Math.floor(index/3);
      } else {
        // Middle row.
        row = 0;
        pos = Math.floor(index/3) + 1;
      }
    } else {
      // Rows, farther than first 3, are filled.
      index -= 8;
      var distance = Math.floor(index/6) + 2;
      if (index % 2 == 0) {
        // Top row.
        row = distance;
        pos = Math.floor(index/2) % 3;
      } else {
        // Bottom row.
        row = -distance;
        pos = Math.floor(index/2) % 3;
      }
    }

    return { row: row, pos: pos };
  }

  /// Returns delay for button showing/hiding animations in delay units.
  /// Delay unit is defined in stylesheet.
  ButtonFly.transitionDelayForButton = function (index) {
    var pos = ButtonFly.posForButton(index);

    var rowDelay, posDelay;

    var distance = Math.abs(pos.row);
    if (distance <= 1) {
      rowDelay = 0;
    } else {
      rowDelay = distance - 1;
    }

    posDelay = pos.pos;

    return rowDelay + posDelay;
  }

  ButtonFly.prototype.variationForButton = function (index) {
    var vars = this.options.buttonsVariations;

    // These calculations were made up experimentally.
    var pos = ButtonFly.posForButton(index);
    var a = Math.abs(pos.row) % vars;
    var b = pos.pos % vars;
    return (a * (vars - 1) + b) % vars;
  }

  // Updates 'transition-delay' property on all child buttons.
  // If reverse is true - farther buttons will have lower delay.
  // If reverse is false or non provided - farther buttons will have bigger delay.
  ButtonFly.prototype.resetTransitionDelays = function (reverse) {
    var delays = [];
    for (i in this.childButtons) {
      delays.push(ButtonFly.transitionDelayForButton(i));
    }
    var maxDelay = Math.max.apply(null, delays);

    var _this = this;
    _this.childButtons.forEach(function (btn, i) {
      if (reverse) {
        btn.style.transitionDelay = (maxDelay - delays[i]) * _this.options.transitionDelay + 's';
      } else {
        btn.style.transitionDelay = delays[i] * _this.options.transitionDelay + 's';
      }
    });
  }

  ButtonFly.prototype.getOrCreateRowElement = function (number) {
    if (number in this.rowElements) return this.rowElements[number];

    var elem = document.createElement('div');
    elem.classList.add('buttonfly__row');
    elem.classList.add('buttonfly__row--n' + number.toString());
    elem.style.marginLeft = this.options.rowLeftMarginStep * Math.abs(number) + 'px';

    if (number == 0) {
      elem.classList.add('buttonfly__row--middle');
      this.wrap.prepend(elem);
    } else if (number > 0) {
      elem.classList.add('buttonfly__row--top');
      var refRow = this.getOrCreateRowElement(number - 1);
      this.wrap.insertBefore(elem, refRow);
    } else {
      elem.classList.add('buttonfly__row--bottom');
      var refRow = this.getOrCreateRowElement(number + 1);
      this.wrap.insertBefore(elem, refRow.nextSibling);
    }

    this.rowElements[number] = elem;

    return elem;
  };

  ButtonFly.prototype.show = function () {
    this.resetTransitionDelays();
    this.element.classList.remove('buttonfly--hidden');
  };

  ButtonFly.prototype.hide = function () {
    this.resetTransitionDelays(true);
    this.reset3dRotation();
    this.element.classList.add('buttonfly--hidden');
  };

  ButtonFly.prototype.isShown = function () {
    return !this.element.classList.contains('buttonfly--hidden');
  };

  ButtonFly.prototype.toggle = function () {
    if (this.isShown()) this.hide();
    else this.show();
  };

  ButtonFly.prototype.copyMainButtonDim = function () {
    // Because 3d rotations make the component explode.
    this.reset3dRotation();
    var bounds = this.mainButton.getBoundingClientRect();
    this.element.style.width = bounds.width + 'px';
    this.element.style.height = bounds.height + 'px';
  };

  ButtonFly.prototype.shiftWrapUp = function () {
    var height = 0;
    for (var num in this.rowElements) {
      if (!this.rowElements.hasOwnProperty(num)) continue;
      if (num <= 0) continue;
      var bounds = this.rowElements[num].getBoundingClientRect();
      height += bounds.height;
    }
    this.wrap.style.top = (-height) + 'px';
  };

  ButtonFly.prototype.updateMainButtonWrap = function () {
    this.copyMainButtonDim();
    this.shiftWrapUp();
  };

  ButtonFly.prototype.set3dRotation = function (cursorClientX, cursorClientY) {
    var mainBtnRect = this.mainButton.getBoundingClientRect();
    var refPointX = mainBtnRect.left;
    var refPointY = mainBtnRect.top + mainBtnRect.height/2;

    var deltaX = cursorClientX - refPointX;
    var deltaY = cursorClientY - refPointY;

    var rotY = deltaX / this.options.rotationPixPerDeg;
    if (rotY > this.options.rotationMaxY) rotY = this.options.rotationMaxY;
    if (rotY < -this.options.rotationMaxY) rotY = -this.options.rotationMaxY;

    var rotX = - deltaY / this.options.rotationPixPerDeg;
    if (rotX > this.options.rotationMaxX) rotY = this.options.rotationMaxX;
    if (rotX < -this.options.rotationMaxX) rotY = -this.options.rotationMaxX;

    var propValue = 'perspective('+this.options.perspective+'px) rotateY('+rotY+'deg) rotateX('+rotX+'deg)';
    this.element.style.transform = propValue;
  };

  ButtonFly.prototype.reset3dRotation = function () {
    this.element.style.transform = null;
  };

  window.ButtonFly = ButtonFly;
})();
