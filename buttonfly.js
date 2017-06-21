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

      btn.style.transitionDuration = _this.options.transitionDuration + 's';
      var delayUnits = ButtonFly.transitionDelayForButton(index);
      btn.style.transitionDelay = _this.options.transitionDelay * delayUnits + 's';
    });

    // Split elements into rows.
    _this.rowElements = {};
    _this.getOrCreateRowElement(0).append(this.mainButton);
    _this.childButtons.forEach(function (btn, index) {
      var rowNumber = ButtonFly.rowForButton(index);
      var rowElem = _this.getOrCreateRowElement(rowNumber);
      rowElem.append(btn);
    });
  };

  ButtonFly.defaultOptions = {
    rowLeftMarginStep: 24,
    transitionDuration: 0.25,
    transitionDelay: 0.05,
    toggleOnMainButton: false,
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

  ButtonFly.prototype.getOrCreateRowElement = function (number) {
    if (number in this.rowElements) return this.rowElements[number];

    var elem = document.createElement('div');
    elem.classList.add('buttonfly__row');
    elem.classList.add('buttonfly__row--n' + number.toString());
    elem.style.marginLeft = this.options.rowLeftMarginStep * Math.abs(number) + 'px';

    if (number == 0) {
      elem.classList.add('buttonfly__row--middle');
      this.element.prepend(elem);
    } else if (number > 0) {
      elem.classList.add('buttonfly__row--top');
      var refRow = this.getOrCreateRowElement(number - 1);
      this.element.insertBefore(elem, refRow);
    } else {
      elem.classList.add('buttonfly__row--bottom');
      var refRow = this.getOrCreateRowElement(number + 1);
      this.element.insertBefore(elem, refRow.nextSibling);
    }

    this.rowElements[number] = elem;

    return elem;
  };

  ButtonFly.prototype.show = function () {
    this.element.classList.remove('buttonfly--hidden');
  };

  ButtonFly.prototype.hide = function () {
    this.element.classList.add('buttonfly--hidden');
  };

  ButtonFly.prototype.isShown = function () {
    return !this.element.classList.contains('buttonfly--hidden');
  };

  ButtonFly.prototype.toggle = function () {
    if (this.isShown()) this.hide();
    else this.show();
  };

  window.ButtonFly = ButtonFly;
})();
