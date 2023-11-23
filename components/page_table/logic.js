class Paged_Collection {
    constructor(page_dom, limit = 10) {
        this.page_dom = page_dom;
        this.page = 1;
        this.limit = limit;

        // page_dom add buttons and page display
        const prev_button = document.createElement("span");
        prev_button.classList.add("button", "material-symbols-rounded");
        prev_button.innerHTML = "navigate_before";
        prev_button.onclick = () => this.prev_page();
        this.page_dom.appendChild(prev_button);

        this.page_dom.appendChild(document.createTextNode("Page: "));
        this.page_pointer_node = document.createElement("span");
        this.page_pointer_node.innerHTML = this.page;
        this.page_dom.appendChild(this.page_pointer_node);

        const next_button = document.createElement("span");
        next_button.classList.add("button", "material-symbols-rounded");
        next_button.innerHTML = "navigate_next";
        next_button.onclick = () => this.next_page();
        this.page_dom.appendChild(next_button);
    }

    set_limit(limit) {
        this.limit = limit;
        this.update();
        return this;
    }

    set_page(page) {
        this.page = page;
        const count = this.update();
        if (count === 0) {
            this.page--;
            this.update();
        }
        this.page_pointer_node.innerHTML = this.page;
        return this;
    }

    prev_page() {
        if (this.page > 1) {
            this.set_page(this.page - 1);
        }
    }

    next_page() {
        this.set_page(this.page + 1);
    }
}

class Paged_Table extends Paged_Collection {
    constructor(table_dom, page_dom, request_data, limit = 10, filename = null) {
        super(page_dom);

        this.table_dom = table_dom;
        this.tbody = table_dom.querySelector("tbody");

        this.request_data = request_data;
        this.sort_by = null;

        const download_button = document.createElement("span");
        download_button.classList.add("button", "material-symbols-rounded");
        download_button.innerHTML = "download";
        download_button.onclick = () => this.export_xlsx(filename);
        this.page_dom.appendChild(download_button);

        // add sort event listener
        const thead = this.table_dom.querySelector("thead tr:last-child");
        this.sort_columns = {};
        for (const th of thead.children) {
            const column_name = th.innerHTML;
            // create a new div including the text, arrow up and arrow down
            th.innerHTML = "";
            const div = document.createElement("div");
            const text_node = document.createTextNode(column_name);
            div.appendChild(text_node);
            const arrow_up = document.createElement("span");
            arrow_up.classList.add("material-symbols-rounded");
            arrow_up.innerHTML = "arrow_drop_up";
            arrow_up.style.display = "none";
            div.appendChild(arrow_up);
            const arrow_down = document.createElement("span");
            arrow_down.classList.add("material-symbols-rounded");
            arrow_down.innerHTML = "arrow_drop_down";
            arrow_down.style.display = "none";
            div.appendChild(arrow_down);
            th.appendChild(div);

            this.sort_columns[column_name] = {
                text: column_name,
                arrow_up: arrow_up,
                arrow_down: arrow_down,
            };
            th.onclick = () => {
                if (this.sort_by != null && this.sort_by.column === column_name) {
                    if (this.sort_by.order === "asc") {
                        this.sort_by_column(column_name, "desc");
                    } else if (this.sort_by.order === "desc") {
                        this.sort_by_column(column_name, null);
                    }
                } else {
                    this.sort_by_column(column_name, "asc");
                }
            };
        }

        this.update();
    }

    sort_by_column(column, order = "asc") {
        for (const column_object of Object.values(this.sort_columns)) {
            column_object.arrow_up.style.display = "none";
            column_object.arrow_down.style.display = "none";
        }
        if (order == null) {
            this.sort_by = null;
            this.update();
        } else {
            this.sort_by = {
                column: column,
                order: order,
            };
            this.update();
        }
        const column_object = this.sort_columns[column];
        if (order === "asc") {
            column_object.arrow_up.style.display = "inline-block";
        } else if (order === "desc") {
            column_object.arrow_down.style.display = "inline-block";
        } else if (order == null) {
            column_object.arrow_up.style.display = "none";
            column_object.arrow_down.style.display = "none";
        }
        return this;
    }

    async update() {
        const data = await this.request_data(this.page, this.limit, this.sort_by);
        this.tbody.innerHTML = "";
        for (const row of data) {
            const tr = document.createElement("tr");
            for (const cell of row) {
                const td = document.createElement("td");
                if (typeof cell === "object") {
                    td.appendChild(cell);
                } else if (typeof cell === "string" && cell.startsWith("<")) {
                    td.innerHTML = cell;
                } else {
                    td.appendChild(document.createTextNode(cell));
                }
                tr.appendChild(td);
            }
            this.tbody.appendChild(tr);
        }
        return data.length;
    }

    export_xlsx(filename = null) {
        const workbook = XLSX.utils.table_to_book(this.table_dom);

        const ws = workbook.Sheets["Sheet1"];
        // change column header to text
        const thead = this.table_dom.querySelector("thead tr:last-child");

        let i = 0;
        for (const column_object of Object.values(this.sort_columns)) {
            const cell = ws[XLSX.utils.encode_cell({ c: i, r: 0 })];
            cell.t = "s";
            cell.v = column_object.text;
            i++;
        }

        // add stamp
        XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], { origin: -1 });

        filename = filename ? filename : "excel_data.xlsx";
        XLSX.writeFileXLSX(workbook, filename);
    }
}

// synonym
class Page_Table extends Paged_Table {
    constructor(table_dom, page_dom, request_data, limit = 10, filename = null) {
        super(table_dom, page_dom, request_data, limit, filename);
    }
}

class Paged_List extends Paged_Collection {
    constructor(list_dom, page_dom, request_data, limit = 10) {
        super(page_dom);

        this.list_dom = list_dom;
        this.request_data = request_data;

        this.update();
    }

    async update() {
        const data = await this.request_data(this.page, this.limit, this.sort_by);
        this.list_dom.innerHTML = "";
        for (const item_dom of data) {
            this.list_dom.appendChild(item_dom);
        }
        return data.length;
    }
}
