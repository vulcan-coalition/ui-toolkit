class Proto_list {
    constructor(tag_list_dom, build_tag_dom) {
        this.tag_list_dom = tag_list_dom;
        this.build_tag_dom = build_tag_dom;

        this.selected_data = [];
    }

    get_selected() {
        // return copy of selected data
        return this.selected_data.slice();
    }

    set_selected(tag) {
        const idx = this.selected_data.indexOf(tag);
        if (idx > -1) {
            return;
        }
        this.selected_data.push(tag);

        const tag_node = this.build_tag_dom(tag);
        let close_button = tag_node.querySelector(".close");
        if (close_button == null) {
            close_button = tag_node;
        }
        close_button.addEventListener(
            "click",
            function () {
                const idx = this.selected_data.indexOf(tag);
                if (idx > -1) {
                    this.selected_data.splice(idx, 1);
                }
                tag_node.remove();
            }.bind(this)
        );
        this.tag_list_dom.appendChild(tag_node);
    }

    clear_selected() {
        this.selected_data.splice(0, this.selected_data.length);
        this.tag_list_dom.innerHTML = "";
    }
}

class Text_list extends Proto_list {
    constructor(input_dom, tag_list_dom, build_tag_dom) {
        super(tag_list_dom, build_tag_dom);

        this.input = input_dom;

        this.input.addEventListener(
            "keydown",
            function (e) {
                if (e.code === "Enter") {
                    const tag = this.input.value.trim();
                    if (tag.length > 0) {
                        this.set_selected(tag);
                        this.input.value = "";
                    }
                }
            }.bind(this)
        );
    }
}

class Suggest_list extends Proto_list {
    constructor(search_input_dom, tag_list_dom, tag_suggest_dom, build_suggest_dom, build_tag_dom) {
        super(tag_list_dom, build_tag_dom);

        this.search_input = search_input_dom;

        this.tag_suggest_dom = tag_suggest_dom;
        this.build_suggest_dom = build_suggest_dom;

        this.data = [];

        this.search_input.addEventListener(
            "input",
            function () {
                const search = this.search_input.value;
                const filtered_data = this.data.filter(function (item) {
                    return item.display.toLowerCase().includes(search.trim().toLowerCase());
                });
                this.tag_suggest_dom.innerHTML = "";
                this.tag_suggest_dom.style.display = "flex";
                filtered_data.forEach(
                    function (item) {
                        const tag_node = this.build_suggest_dom(item.tag);
                        tag_node.addEventListener(
                            "click",
                            function () {
                                this.set_selected(item.tag);
                                this.hide_suggest();
                            }.bind(this)
                        );
                        this.tag_suggest_dom.appendChild(tag_node);
                    }.bind(this)
                );
            }.bind(this)
        );

        // if search input is enter and has one item then auto select
        this.search_input.addEventListener(
            "keydown",
            function (e) {
                if (e.code === "Enter") {
                    const search = this.search_input.value;
                    const filtered_data = this.data.filter(function (item) {
                        return item.display.toLowerCase().includes(search.toLowerCase());
                    });
                    if (filtered_data.length == 1) {
                        this.set_selected(filtered_data[0].tag);
                        this.hide_suggest();
                    }
                }
            }.bind(this)
        );

        // also remove suggest when not focus
        this.search_input.addEventListener(
            "blur",
            function () {
                setTimeout(
                    function () {
                        this.tag_suggest_dom.innerHTML = "";
                        this.tag_suggest_dom.style.display = "none";
                    }.bind(this),
                    300
                );
            }.bind(this)
        );

        this.tag_suggest_dom.style.display = "none";
    }

    hide_suggest() {
        this.tag_suggest_dom.innerHTML = "";
        this.tag_suggest_dom.style.display = "none";
    }

    add_items(items) {
        // [{tag: "", display: ""}]
        for (let item of items) {
            // if item is string then convert to object
            if (typeof item === "string") {
                item = { tag: item, display: item };
            }
            this.data.push(item);
        }
    }

    select_all() {
        this.clear_selected();
        this.data.forEach(
            function (item) {
                this.set_selected(item.tag);
            }.bind(this)
        );
    }
}
