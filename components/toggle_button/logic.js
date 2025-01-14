class Toggle_Button {
    constructor(dom, symbol_list, on_toggled, class_list = null) {
        this.dom = dom;
        this.symbol_list = symbol_list;
        this.on_toggled = on_toggled;

        this.selecting = 0;
        this.dom.innerHTML = this.symbol_list[this.selecting];
        this.dom.classList.add(ui_toolkit_symbols_class);
        if (class_list != null) {
            for (let c of class_list) {
                this.dom.classList.add(c);
            }
        }

        this.dom.addEventListener("click", this.toggle.bind(this));
    }

    toggle() {
        this.selecting = (this.selecting + 1) % this.symbol_list.length;
        this.dom.innerHTML = this.symbol_list[this.selecting];
        this.on_toggled(this.selecting);
    }

    toggle_not_trigger() {
        this.selecting = (this.selecting + 1) % this.symbol_list.length;
        this.dom.innerHTML = this.symbol_list[this.selecting];
    }

    select(index) {
        this.selecting = index;
        this.dom.innerHTML = this.symbol_list[this.selecting];
        this.on_toggled(this.selecting);
    }

    select_not_trigger(index) {
        this.selecting = index;
        this.dom.innerHTML = this.symbol_list[this.selecting];
    }
}
