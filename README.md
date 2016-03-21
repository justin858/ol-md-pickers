# mdPickers
Material Design date/time pickers built with Angular Material and Moment.js.
This fork allows for more configuration, such as floating labels, placeholders 
and other styling options. Also updated validation, providing min, max, format and required validators using the
$validators pipeline.

Original mdPickers can be found at: https://github.com/alenaksu/mdPickers

## Requirements

* [moment.js](http://momentjs.com/)
* [AngularJS](https://angularjs.org/)
* [Angular Material](https://material.angularjs.org/)

## Using mdPickers

Install via Bower:

```bash
bower install ol-md-pickers
```

Use in Angular:
```javascript
angular.module( 'YourApp', [ 'mdPickers' ] )
  .controller("YourController", YourController );
```

## Building mdPickers

First install or update your local project's __npm__ tools:

```bash
# First install all the npm tools:
npm install

# or update
npm update
```

Then run the default gulp task:

```bash
# builds all files in the `dist` directory
gulp
```
