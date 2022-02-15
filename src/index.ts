/**
 * T O D O   L I S T
 *
 * ! WRITE TESTS FOR STDLIB
 *
 * ? Make CLI
 *
 * Standard library
 * - Extended list operations
 * - String utility
 *
 * UI/UX
 * - CLI for executing scripts
 * - Package manager
 * - VSCode language support extension
 *
 * Modules
 * - Import modules as whole or a few symbols
 * - Export symbols
 *
 * Bindings
 * - File system
 * - Operating system
 * - Networking
 * - JavaScript libraries
 *
 * Metaprogramming
 * - Create native-like functions
 * - Special permissions to expression representation
 * - Direct bindings to evaluation and symbol names
 *
 * Specifications
 *
 * Tutorial
 */

import { execute } from "./pub/execute";

execute(`\
; Metaprogramming example
;
; (s hello world) ; => "hello world"
;
; (mdefn s args (
;     (def mapped (std:list:map args (lambda (e) (
;         (if (missymbol e)
;            (msymbolname e)
;            (meval e))
;     ))))
;     (std:list:join mapped " ")
; ))

(print (str:touppercase "hello"))
(print (num:tofixed 10.23124 "2"))

(use str)

(print (touppercase "hello"))

(def toupcase touppercase)

(print (toupcase "hello"))
`);
