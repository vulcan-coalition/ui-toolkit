class Menu_Item {
    constructor(icon, text, visibility = true, class_name = null) {
        this.type = "base";
        this.icon = icon;
        this.text = text;
        this.visibility = visibility;
        this.class_name = class_name;
    }

    assign_parent_menu(parent_menu) {
        this.parent_menu = parent_menu;
    }

    render(menu) {
        this.dom = document.createElement("div");
        this.dom.classList.add("menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        const icon_dom = document.createElement("span");
        icon_dom.classList.add(ui_toolkit_symbols_class);
        icon_dom.setAttribute("aria-hidden", "true");
        icon_dom.innerHTML = this.icon;
        const text_dom = document.createElement("span");
        text_dom.classList.add("text");
        text_dom.innerHTML = this.text;
        this.dom.appendChild(icon_dom);
        this.dom.appendChild(text_dom);
        menu.appendChild(this.dom);
    }
}

class Menu_Item_Link extends Menu_Item {
    constructor(icon, text, href, link_type = "self", visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "link";
        this.href = href;
        this.link_type = link_type;
    }

    render(menu) {
        this.dom = document.createElement("a");
        this.dom.classList.add("link", "menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        this.dom.href = this.href;
        if (this.link_type == "new_tab") {
            this.dom.target = "_blank";
        }
        const icon_dom = document.createElement("span");
        icon_dom.classList.add(ui_toolkit_symbols_class);
        icon_dom.setAttribute("aria-hidden", "true");
        icon_dom.innerHTML = this.icon;
        const text_dom = document.createElement("span");
        text_dom.classList.add("text");
        text_dom.innerHTML = this.text;
        this.dom.appendChild(icon_dom);
        this.dom.appendChild(text_dom);
        menu.appendChild(this.dom);
    }
}

class Menu_Item_Sub extends Menu_Item {
    constructor(icon, text, sub_items, append_parent = false, visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "sub";
        this.sub_items = sub_items;
        this.append_parent = append_parent;
        this.sub_menu_obj = new Menu(this.sub_items);
    }

    assign_parent_menu(parent_menu) {
        this.parent_menu = parent_menu;
        this.parent_menu.sub_menus.push(this);
    }

    collapse() {
        if (this.sub_menu_obj.dom != null) {
            this.sub_menu_obj.dom.classList.add("hide");
            this.arrow.innerHTML = "segment";
        }
        this.sub_menu_obj.collapse_all();
    }

    render(menu, events) {
        this.dom = document.createElement("div");
        this.dom.classList.add("sub", "menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);

        const group = document.createElement("div");
        group.classList.add("group");

        const icon_dom = document.createElement("span");
        icon_dom.setAttribute("aria-hidden", "true");
        icon_dom.classList.add(ui_toolkit_symbols_class);
        icon_dom.innerHTML = this.icon;
        const text_dom = document.createElement("span");
        text_dom.role = "heading";
        text_dom.setAttribute("aria-level", "3");
        text_dom.classList.add("text");
        text_dom.innerHTML = this.text;
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.classList.add(ui_toolkit_symbols_class, "arrow");
        arrow.innerHTML = "segment";
        this.arrow = arrow;

        group.appendChild(icon_dom);
        group.appendChild(text_dom);
        group.appendChild(arrow);

        this.dom.appendChild(group);

        this.dom.addEventListener(
            "touchstart",
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                this.parent_menu.collapse_all();
                if (this.sub_menu_obj.dom.classList.contains("hide")) {
                    this.sub_menu_obj.dom.classList.remove("hide");
                    this.arrow.innerHTML = "arrow_drop_down";
                } else {
                    this.sub_menu_obj.dom.classList.add("hide");
                    this.arrow.innerHTML = "segment";
                }
            }.bind(this)
        );

        this.dom.addEventListener(
            "mouseover",
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                this.parent_menu.collapse_all();
                this.sub_menu_obj.dom.classList.remove("hide");
                this.arrow.innerHTML = "arrow_drop_down";
            }.bind(this)
        );

        menu.appendChild(this.dom);

        this.sub_menu_obj.render(menu, events, this.append_parent, false);
        this.sub_menu_obj.dom.classList.add("hide");
    }
}

class Menu_Item_Header extends Menu_Item {
    constructor(text, visibility = true, class_name = null) {
        super(null, text, visibility, class_name);
        this.type = "header";
    }

    render(menu) {
        this.dom = document.createElement("span");
        this.dom.innerHTML = this.text;
        this.dom.classList.add("header", "menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        menu.appendChild(this.dom);
    }
}

class Menu_Item_Hr extends Menu_Item {
    constructor(visibility = true, class_name = null) {
        super(null, null, visibility, class_name);
        this.type = "hr";
    }

    render(menu) {
        this.dom = document.createElement("div");
        this.dom.classList.add("hr", "menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        menu.appendChild(this.dom);
    }
}

class Menu_Item_Button extends Menu_Item {
    constructor(icon, text, onclick, visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "button";
        this.onclick = onclick;
    }

    render(menu) {
        this.dom = document.createElement("div");
        this.dom.classList.add("button", "menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        this.dom.role = "button";
        const icon_dom = document.createElement("span");
        icon_dom.classList.add(ui_toolkit_symbols_class);
        icon_dom.innerHTML = this.icon;
        const text_dom = document.createElement("span");
        text_dom.classList.add("text");
        text_dom.innerHTML = this.text;
        this.dom.appendChild(icon_dom);
        this.dom.appendChild(text_dom);
        this.dom.addEventListener("click", this.onclick);
        menu.appendChild(this.dom);
    }
}

class Menu_Item_DOM extends Menu_Item {
    constructor(dom, visibility = true, class_name = null) {
        super(null, null, visibility, class_name);
        this.type = "dom";
        this.dom = dom;
    }

    render(menu) {
        this.dom.classList.add("menu-item");
        if (this.class_name != null) this.dom.classList.add(this.class_name);
        menu.appendChild(this.dom);
    }
}

class Menu {
    constructor(menu_items) {
        this.menu_items = [];
        this.sub_menus = [];

        if (menu_items != null) {
            this.add_items(menu_items);
        }
    }

    add_item(item) {
        this.menu_items.push(item);
        item.assign_parent_menu(this);
    }

    add_items(items) {
        for (const item of items) {
            this.menu_items.push(item);
            item.assign_parent_menu(this);
        }
    }

    collapse_all() {
        for (const s of this.sub_menus) {
            s.collapse();
        }
    }

    render(parent_dom, item_events, append_parent = false, root = true) {
        this.dom = document.createElement("div");
        this.dom.classList.add("sub-menu");

        if (append_parent) {
            parent_dom.parentNode.appendChild(this.dom);
        } else {
            parent_dom.appendChild(this.dom);
        }

        for (const item of this.menu_items) {
            if (item.visibility != null && item.visibility == false) continue;
            item.render(this.dom, item_events);
            switch (item.type) {
                case "link":
                case "button":
                case "sub":
                    for (const [event, handler] of Object.entries(item_events)) {
                        item.dom.addEventListener(event, handler.bind(null, item.dom, item));
                    }
                    break;
                default:
                    break;
            }
        }

        if (root) {
            let menu_timeout = null;
            parent_dom.addEventListener("mouseover", function () {
                if (menu_timeout != null) clearTimeout(menu_timeout);
            });
            parent_dom.addEventListener(
                "mouseleave",
                function () {
                    if (menu_timeout != null) clearTimeout(menu_timeout);
                    menu_timeout = setTimeout(this.collapse_all.bind(this), 500);
                }.bind(this)
            );
        }
    }
}
