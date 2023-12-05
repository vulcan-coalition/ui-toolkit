class Menu_Item {
    constructor(icon, text, visibility = true, class_name = null) {
        this.type = "base";
        this.icon = icon;
        this.text = text;
        this.visibility = visibility;
        this.class_name = class_name;
    }
}

class Menu_Item_Link extends Menu_Item {
    constructor(icon, text, href, link_type = "self", visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "link";
        this.href = href;
        this.link_type = link_type;
    }
}

class Menu_Item_Sub extends Menu_Item {
    constructor(icon, text, sub_items, append_parent = false, visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "sub";
        this.sub_items = sub_items;
        this.append_parent = append_parent;
    }
}

class Menu_Item_Header extends Menu_Item {
    constructor(text, visibility = true, class_name = null) {
        super(null, text, visibility, class_name);
        this.type = "header";
    }
}

class Menu_Item_Hr extends Menu_Item {
    constructor(visibility = true, class_name = null) {
        super(null, null, visibility, class_name);
        this.type = "hr";
    }
}

class Menu_Item_Button extends Menu_Item {
    constructor(icon, text, onclick, visibility = true, class_name = null) {
        super(icon, text, visibility, class_name);
        this.type = "button";
        this.onclick = onclick;
    }
}

class Menu_Item_DOM extends Menu_Item {
    constructor(dom, visibility = true, class_name = null) {
        super(null, null, visibility, class_name);
        this.type = "dom";
        this.dom = dom;
    }
}

class Menu {
    constructor(menu_dom) {
        this.menu = menu_dom;
        this.menu_items = [];
    }

    add_item(item) {
        this.menu_items.push(item);
    }

    add_items(items) {
        for (const item of items) {
            this.menu_items.push(item);
        }
    }

    render(events) {
        for (const item of this.menu_items) {
            if (item.visibility != null && item.visibility == false) continue;
            let item_dom = null;
            switch (item.type) {
                case "link":
                    {
                        item_dom = document.createElement("a");
                        item_dom.href = item.href;
                        if (item.link_type == "new_tab") {
                            item_dom.target = "_blank";
                        }
                        const icon = document.createElement("span");
                        icon.classList.add("material-symbols-rounded");
                        icon.setAttribute("aria-hidden", "true");
                        icon.innerHTML = item.icon;
                        const text = document.createElement("span");
                        text.classList.add("text");
                        text.innerHTML = item.text;
                        item_dom.appendChild(icon);
                        item_dom.appendChild(text);
                    }
                    break;
                case "sub":
                    {
                        item_dom = document.createElement("div");
                        item_dom.classList.add("sub");
                        const icon = document.createElement("span");
                        icon.setAttribute("aria-hidden", "true");
                        icon.classList.add("material-symbols-rounded");
                        icon.innerHTML = item.icon;
                        const text = document.createElement("span");
                        text.role = "heading";
                        text.setAttribute("aria-level", "3");
                        text.classList.add("text");
                        text.innerHTML = item.text;
                        const arrow = document.createElement("span");
                        arrow.setAttribute("aria-hidden", "true");
                        arrow.classList.add("material-symbols-rounded");
                        arrow.innerHTML = "arrow_drop_down";
                        const group = document.createElement("div");
                        group.classList.add("group");
                        group.appendChild(icon);
                        group.appendChild(text);
                        group.appendChild(arrow);
                        item_dom.appendChild(group);

                        const sub_menu = document.createElement("div");
                        sub_menu.classList.add("sub-menu", "hide");
                        const sub_menu_obj = new Menu(sub_menu);
                        sub_menu_obj.add_items(item.sub_items);
                        sub_menu_obj.render(events);
                        if (item.append_parent) this.menu.after(sub_menu);
                        else item_dom.appendChild(sub_menu);

                        item_dom.addEventListener("mouseover", function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            sub_menu.classList.remove("hide");
                            arrow.innerHTML = "arrow_drop_up";
                        });

                        item_dom.addEventListener("touchstart", function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (sub_menu.classList.contains("hide")) {
                                sub_menu.classList.remove("hide");
                                arrow.innerHTML = "arrow_drop_up";
                            } else {
                                sub_menu.classList.add("hide");
                                arrow.innerHTML = "arrow_drop_down";
                            }
                        });

                        let collapsed_timeout = null;
                        sub_menu.addEventListener("mouseover", function () {
                            if (collapsed_timeout != null) clearTimeout(collapsed_timeout);
                        });
                        sub_menu.addEventListener("mouseleave", function () {
                            if (collapsed_timeout != null) clearTimeout(collapsed_timeout);
                            collapsed_timeout = setTimeout(function () {
                                sub_menu.classList.add("hide");
                                arrow.innerHTML = "arrow_drop_down";
                            }, 500);
                        });
                    }
                    break;
                case "header":
                    {
                        item_dom = document.createElement("span");
                        item_dom.innerHTML = item.text;
                    }
                    break;
                case "hr":
                    {
                        item_dom = document.createElement("div");
                        item_dom.classList.add("hr");
                    }
                    break;
                case "button":
                    {
                        item_dom = document.createElement("div");
                        item_dom.role = "button";
                        const icon = document.createElement("span");
                        icon.classList.add("material-symbols-rounded");
                        icon.innerHTML = item.icon;
                        const text = document.createElement("span");
                        text.classList.add("text");
                        text.innerHTML = item.text;
                        item_dom.appendChild(icon);
                        item_dom.appendChild(text);
                        item_dom.addEventListener("click", item.onclick);
                    }
                    break;
                case "dom":
                    {
                        item_dom = item.dom;
                    }
                    break;
            }

            if (item.class_name != null) item_dom.classList.add(item.class_name);
            this.menu.appendChild(item_dom);

            switch (item.type) {
                case "link":
                case "button":
                case "sub":
                    for (const event in events) {
                        item_dom.addEventListener(event, events[event].bind(null, item_dom, item));
                    }
                    break;
                default:
                    break;
            }
        }
    }
}
