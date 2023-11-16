class Page_Table {
    constructor(table_dom, page_dom, request_data, limit = 10) {
        this.table_dom = table_dom;
        this.tbody = table_dom.querySelector("tbody");
        this.page_dom = page_dom;
        this.page = 1;
        this.limit = limit;
    }

    set_limit(limit) {
        this.limit = limit;
        this.update();
    }

    set_page(page) {
        this.page = page;
        this.page_dom.innerHTML = this.page;
        this.update();
    }

    prev_page() {
        if (this.page > 1) {
            this.page--;
            this.page_dom.innerHTML = this.page;
            this.update();
        }
    }

    next_page() {
        this.page++;
        this.page_dom.innerHTML = this.page;
        this.update();
    }

    async update() {
        const data = await request_data(this.page, this.limit);
        this.tbody.innerHTML = "";
        for (const row of data) {
            const tr = document.createElement("tr");
            for (const cell of row) {
                const td = document.createElement("td");
                td.innerHTML = cell;
                tr.appendChild(td);
            }
            this.tbody.appendChild(tr);
        }
    }

    export_xlsx(filename = null) {
        const workbook = XLSX.utils.table_to_book(this.table_dom);

        const ws = workbook.Sheets["Sheet1"];
        XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], { origin: -1 });

        filename = filename ? filename : "excel_data.xlsx";
        XLSX.writeFileXLSX(workbook, filename);
    }
}
