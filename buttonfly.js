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

    // Save button elements.
    _this.element = element;
    _this.element.classList.add("buttonfly");

    _this.mainButton = _this.element.children[0];
    _this.mainButton.classList.add("buttonfly__button");
    _this.mainButton.classList.add("buttonfly__button--main");

    _this.childButtons = Array.prototype.slice.call(_this.element.children, 1);
    _this.childButtons.forEach(function (btn) {
      btn.classList.add("buttonfly__button");
      btn.classList.add("buttonfly__button--child");
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
  };

  /// Returns a row number for button with given index.
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
  ButtonFly.rowForButton = function (index) {
    if (index < 8) {
      // First three rows (top, middle, bottom) are filled.
      if (index % 3 == 0) {
        // First top row.
        return 1;
      } else if (index % 3 == 1) {
        // First button row.
        return -1;
      } else {
        // Middle row.
        return 0;
      }
    } else {
      // Rows, farther than first 3, are filled.
      index -= 8;
      var distance = Math.floor(index/6) + 2;
      if (index % 2 == 0) {
        // Top row.
        return distance;
      } else {
        // Bottom row.
        return -distance;
      }
    }
  }

  ButtonFly.prototype.getOrCreateRowElement = function (number) {
    if (number in this.rowElements) return this.rowElements[number];

    var elem = document.createElement('div');
    elem.classList.add('buttonfly__row');
    elem.classList.add('buttonfly__row--n' + number.toString());
    elem.style.marginLeft = this.options.rowLeftMarginStep * Math.abs(number) + 'px';

    if (number == 0) {
      this.element.prepend(elem);
    } else if (number > 0) {
      var refRow = this.getOrCreateRowElement(number - 1);
      this.element.insertBefore(elem, refRow);
    } else {
      var refRow = this.getOrCreateRowElement(number + 1);
      this.element.insertBefore(elem, refRow.nextSibling);
    }

    this.rowElements[number] = elem;

    return elem;
  };

  window.ButtonFly = ButtonFly;
})();
