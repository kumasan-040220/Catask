"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/dashboard/page",{

/***/ "(app-pages-browser)/./app/components/TaskList.tsx":
/*!*************************************!*\
  !*** ./app/components/TaskList.tsx ***!
  \*************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": function() { return /* binding */ TaskList; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _Task__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Task */ \"(app-pages-browser)/./app/components/Task.tsx\");\n/* harmony import */ var _utils_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/types */ \"(app-pages-browser)/./app/utils/types.ts\");\n/* harmony import */ var _utils_taskUtils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/taskUtils */ \"(app-pages-browser)/./app/utils/taskUtils.ts\");\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\n\n\nfunction TaskList(param) {\n    let { tasks, filter, onToggle, onDelete } = param;\n    _s();\n    const filteredAndSortedTasks = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(()=>{\n        const filtered = (0,_utils_taskUtils__WEBPACK_IMPORTED_MODULE_4__.filterTasks)(tasks, filter);\n        return (0,_utils_taskUtils__WEBPACK_IMPORTED_MODULE_4__.sortTasks)(filtered);\n    }, [\n        tasks,\n        filter\n    ]);\n    if (filteredAndSortedTasks.length === 0) {\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"p-4 text-center text-gray-500\",\n            children: filter === _utils_types__WEBPACK_IMPORTED_MODULE_3__.TaskFilter.ALL ? \"タスクはありません。\" : filter === _utils_types__WEBPACK_IMPORTED_MODULE_3__.TaskFilter.ACTIVE ? \"未完了のタスクはありません。\" : \"完了したタスクはありません。\"\n        }, void 0, false, {\n            fileName: \"/Users/takumatamaki/code/Catask/app/components/TaskList.tsx\",\n            lineNumber: 28,\n            columnNumber: 7\n        }, this);\n    }\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"mt-4\",\n        children: filteredAndSortedTasks.map((task)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_Task__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                task: task,\n                onToggle: onToggle,\n                onDelete: onDelete\n            }, task.id, false, {\n                fileName: \"/Users/takumatamaki/code/Catask/app/components/TaskList.tsx\",\n                lineNumber: 41,\n                columnNumber: 9\n            }, this))\n    }, void 0, false, {\n        fileName: \"/Users/takumatamaki/code/Catask/app/components/TaskList.tsx\",\n        lineNumber: 39,\n        columnNumber: 5\n    }, this);\n}\n_s(TaskList, \"v/8LXMurb+xzGatatQ0D5JoH3b0=\");\n_c = TaskList;\nvar _c;\n$RefreshReg$(_c, \"TaskList\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9jb21wb25lbnRzL1Rhc2tMaXN0LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFFZ0M7QUFDTjtBQUNvQztBQUNGO0FBUzdDLFNBQVNLLFNBQVMsS0FLakI7UUFMaUIsRUFDL0JDLEtBQUssRUFDTEMsTUFBTSxFQUNOQyxRQUFRLEVBQ1JDLFFBQVEsRUFDTSxHQUxpQjs7SUFNL0IsTUFBTUMseUJBQXlCViw4Q0FBT0EsQ0FBQztRQUNyQyxNQUFNVyxXQUFXUiw2REFBV0EsQ0FBQ0csT0FBT0M7UUFDcEMsT0FBT0gsMkRBQVNBLENBQUNPO0lBQ25CLEdBQUc7UUFBQ0w7UUFBT0M7S0FBTztJQUVsQixJQUFJRyx1QkFBdUJFLE1BQU0sS0FBSyxHQUFHO1FBQ3ZDLHFCQUNFLDhEQUFDQztZQUFJQyxXQUFVO3NCQUNaUCxXQUFXTCxvREFBVUEsQ0FBQ2EsR0FBRyxHQUN0QixlQUNBUixXQUFXTCxvREFBVUEsQ0FBQ2MsTUFBTSxHQUM1QixtQkFDQTs7Ozs7O0lBR1Y7SUFFQSxxQkFDRSw4REFBQ0g7UUFBSUMsV0FBVTtrQkFDWkosdUJBQXVCTyxHQUFHLENBQUMsQ0FBQ0MscUJBQzNCLDhEQUFDakIsNkNBQUlBO2dCQUVIaUIsTUFBTUE7Z0JBQ05WLFVBQVVBO2dCQUNWQyxVQUFVQTtlQUhMUyxLQUFLQyxFQUFFOzs7Ozs7Ozs7O0FBUXRCO0dBbkN3QmQ7S0FBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vYXBwL2NvbXBvbmVudHMvVGFza0xpc3QudHN4P2QzMWQiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCI7XG5cbmltcG9ydCB7IHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBUYXNrIGZyb20gXCIuL1Rhc2tcIjtcbmltcG9ydCB7IFRhc2sgYXMgVGFza1R5cGUsIFRhc2tGaWx0ZXIgfSBmcm9tIFwiLi4vdXRpbHMvdHlwZXNcIjtcbmltcG9ydCB7IGZpbHRlclRhc2tzLCBzb3J0VGFza3MgfSBmcm9tIFwiLi4vdXRpbHMvdGFza1V0aWxzXCI7XG5cbmludGVyZmFjZSBUYXNrTGlzdFByb3BzIHtcbiAgdGFza3M6IFRhc2tUeXBlW107XG4gIGZpbHRlcjogVGFza0ZpbHRlcjtcbiAgb25Ub2dnbGU6IChpZDogc3RyaW5nKSA9PiB2b2lkO1xuICBvbkRlbGV0ZTogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRhc2tMaXN0KHtcbiAgdGFza3MsXG4gIGZpbHRlcixcbiAgb25Ub2dnbGUsXG4gIG9uRGVsZXRlLFxufTogVGFza0xpc3RQcm9wcykge1xuICBjb25zdCBmaWx0ZXJlZEFuZFNvcnRlZFRhc2tzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWx0ZXJUYXNrcyh0YXNrcywgZmlsdGVyKTtcbiAgICByZXR1cm4gc29ydFRhc2tzKGZpbHRlcmVkKTtcbiAgfSwgW3Rhc2tzLCBmaWx0ZXJdKTtcblxuICBpZiAoZmlsdGVyZWRBbmRTb3J0ZWRUYXNrcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgdGV4dC1jZW50ZXIgdGV4dC1ncmF5LTUwMFwiPlxuICAgICAgICB7ZmlsdGVyID09PSBUYXNrRmlsdGVyLkFMTFxuICAgICAgICAgID8gXCLjgr/jgrnjgq/jga/jgYLjgorjgb7jgZvjgpPjgIJcIlxuICAgICAgICAgIDogZmlsdGVyID09PSBUYXNrRmlsdGVyLkFDVElWRVxuICAgICAgICAgID8gXCLmnKrlrozkuobjga7jgr/jgrnjgq/jga/jgYLjgorjgb7jgZvjgpPjgIJcIlxuICAgICAgICAgIDogXCLlrozkuobjgZfjgZ/jgr/jgrnjgq/jga/jgYLjgorjgb7jgZvjgpPjgIJcIn1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNFwiPlxuICAgICAge2ZpbHRlcmVkQW5kU29ydGVkVGFza3MubWFwKCh0YXNrKSA9PiAoXG4gICAgICAgIDxUYXNrXG4gICAgICAgICAga2V5PXt0YXNrLmlkfVxuICAgICAgICAgIHRhc2s9e3Rhc2t9XG4gICAgICAgICAgb25Ub2dnbGU9e29uVG9nZ2xlfVxuICAgICAgICAgIG9uRGVsZXRlPXtvbkRlbGV0ZX1cbiAgICAgICAgLz5cbiAgICAgICkpfVxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sIm5hbWVzIjpbInVzZU1lbW8iLCJUYXNrIiwiVGFza0ZpbHRlciIsImZpbHRlclRhc2tzIiwic29ydFRhc2tzIiwiVGFza0xpc3QiLCJ0YXNrcyIsImZpbHRlciIsIm9uVG9nZ2xlIiwib25EZWxldGUiLCJmaWx0ZXJlZEFuZFNvcnRlZFRhc2tzIiwiZmlsdGVyZWQiLCJsZW5ndGgiLCJkaXYiLCJjbGFzc05hbWUiLCJBTEwiLCJBQ1RJVkUiLCJtYXAiLCJ0YXNrIiwiaWQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/components/TaskList.tsx\n"));

/***/ })

});