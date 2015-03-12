/* eslint-env es6 */
import { lighten, darken } from './colorHelpers'

// like twitter bootstrap

// https://github.com/twbs/bootstrap/blob/f5beebe726aa8c1810015d8c62931f4559b49664/less/variables.less
const variables = {};

variables.gray = {};
variables.gray.base    = '#000';                                        // ln 10
variables.gray.darker  = lighten(variables.gray.base, 13.5);            // ln 11
variables.gray.dark    = lighten(variables.gray.base, 20);              // ln 12
variables.gray.gray    = lighten(variables.gray.base, 33.5);            // ln 13
variables.gray.light   = lighten(variables.gray.base, 46.7);            // ln 14
variables.gray.lighter = lighten(variables.gray.base, 93.5);            // ln 15

variables.brand = {};
variables.brand.primary = darken('#428bca', 6.5);                       // ln 17
variables.brand.success = '#5cb85c';                                    // ln 18
variables.brand.info    = '#5bc0de';                                    // ln 19
variables.brand.warning = '#f0ad4e';                                    // ln 20
variables.brand.danger  = '#d9534f';                                    // ln 21

variables.link = {hover: {}};
variables.link.color = variables.brand.primary;                         // ln 34
variables.link.hover.color = darken(variables.link.color, 15);          // ln 36
variables.link.hover.decoration = 'underline';                          // ln 38

variables.font_size = {};
variables.font_size.base  = 14;                                         // ln 51
variables.font_size.large = Math.ceil(variables.font_size.base * 1.25); // ln 52
variables.font_size.small = Math.ceil(variables.font_size.base * 0.85); // ln 53
variables.font_size.tiny  = variables.font_size.small

variables.line_height = {};
variables.line_height.base     = 1.428571429;                           // ln 63
variables.line_height.large    = 1.5;                                   // ln 102
variables.line_height.small    = 1.3333333;                             // ln 103
variables.line_height.tiny     = variables.line_height.small;
variables.line_height_computed = variables.line_height.base *
                                 variables.font_size.base;              // ln 65

variables.padding = {base: {}, large: {}, small: {}, tiny: {}};
variables.padding.base.vertical = 6;                                    // ln 90
variables.padding.base.horizontal = 12;                                 // ln 91
variables.padding.large.vertical = 10;                                  // ln 93
variables.padding.large.horizontal = 16;                                // ln 94
variables.padding.small.vertical = 5;                                   // ln 96
variables.padding.small.horizontal = 10;                                // ln 97
variables.padding.tiny.vertical = 1;                                    // ln 99
variables.padding.tiny.horizontal = 5;                                  // ln 100

variables.border_radius = {};
variables.border_radius.base   = 4;                                     // ln 105
variables.border_radius.large  = 6;                                     // ln 106
variables.border_radius.small  = 3;                                     // ln 107
variables.border_radius.tiny = variables.border_radius.small;

variables.btn = {default: {}, primary: {}, success: {}, info: {},
                 warning: {}, danger: {}};
variables.btn.font_weight = 'normal';                                   // ln 145

variables.btn.default.color  = '#333';                                  // ln 147
variables.btn.default.bg     = '#fff';                                  // ln 148
variables.btn.default.border = '#ccc';                                  // ln 149

variables.btn.primary.color  = '#fff';                                  // ln 151
variables.btn.primary.bg     = variables.brand.primary;                 // ln 152
variables.btn.primary.border = darken(variables.btn.primary.bg, 5);     // ln 149

variables.btn.success.color  = '#fff';                                  // ln 155
variables.btn.success.bg     = variables.brand.success;                 // ln 156fc
variables.btn.success.border = darken(variables.btn.success.bg, 5);     // ln 157

variables.btn.info.color     = '#fff';                                  // ln 159
variables.btn.info.bg        = variables.brand.info;                    // ln 160
variables.btn.info.border    = darken(variables.btn.info.bg, 5);        // ln 161

variables.btn.warning.color  = '#fff';                                  // ln 163
variables.btn.warning.bg     = variables.brand.warning;                 // ln 164
variables.btn.warning.border = darken(variables.btn.warning.bg, 5);     // ln 164

variables.btn.danger.color   = '#fff';                                  // ln 167
variables.btn.danger.bg      = variables.brand.danger;                  // ln 168
variables.btn.danger.border  = darken(variables.btn.danger.bg, 5);      // ln 169

variables.btn.link = {disabled: {color: variables.gray.light}}          // ln 171

variables.cursor = {disabled: 'not-allowed'};                           // ln 222

export default variables;
