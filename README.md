# ui-toolkit

Pure Javascript UI toolkit
See examples in the [example file `./dist/example.html`](./dist/example.html).

## How to use

Work in junction with [Material Symbols and Icons](https://fonts.google.com/icons).

Be sure to include the following in the head of your HTML file to load the Material Symbols font:

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

Or only subset of the icon variation to reduce the file size.

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,0,0" />
```

Also in css:

```
.material-symbols-rounded {
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48;
}
```

Finally to define the class for the icons in the header section of your html page.
This has to match the class used in the CSS:

```
<script>
    ui_toolkit_symbols_class = "material-symbols-rounded";
</script>
```

## Customization

If you make changes to the source code, you can build the project using npm. Follow these steps:

1. Install [Node.js](https://nodejs.org/en/download/)
2. Run `npm install` in the root directory.
3. Run `npm run build` to build the project.
4. The output will be in the `dist` directory.
