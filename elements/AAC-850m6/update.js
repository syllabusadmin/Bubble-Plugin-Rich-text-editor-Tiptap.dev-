function(instance, properties, context) {
    if (properties.collab_active === true && !properties.collab_jwt) {
        console.log(
            "collab is active but jwt token is not yet loaded. Returning..."
        );
        return;
    }


    // load once
    if (!instance.data.isEditorSetup) {
        let initialContent = properties.bubble.auto_binding()
        ? properties.autobinding
        : properties.initialContent;
        instance.data.initialContent = initialContent; // a string to keep track of what's currently in the initialContent so that the editor can change when the initialContent changes
        let content = properties.content_is_json
        ? JSON.parse(initialContent)
        : initialContent;

        let placeholder = properties.placeholder;
        let bubbleMenu = properties.bubbleMenu;
        let floatingMenu = properties.floatingMenu;

        let preserveWhitespace =
            properties.parseOptions_preserveWhitespace === "true"
        ? true
        : properties.parseOptions_preserveWhitespace === "false"
        ? false
        : "full";

        // create the editor div
        const randomId = (Math.random() + 1).toString(36).substring(3);
        instance.data.randomId = randomId;
        var d = document.createElement("div");
        d.id = "tiptapEditor-" + randomId;
        d.style = "flex-grow: 1; display: flex;";
        instance.data.tiptapEditorID = d.id;
        instance.canvas.append(d);

        // pull the libraries that were loaded on Header

        const Heading = window.tiptapHeading;
        const Bold = window.tiptapBold;
        const Code = window.tiptapCode;
        const Italic = window.tiptapItalic;
        const Strike = window.tiptapStrike;
        const Dropcursor = window.tiptapDropcursor;
        const Gapcursor = window.tiptapGapcursor;
        const History = window.tiptapHistory;
        const Blockquote = window.tiptapBlockquote;
        const BulletList = window.tiptapBulletList;
        const CodeBlock = window.tiptapCodeBlock;
        const HorizontalRule = window.tiptapHorizontalRule;
        const ListItem = window.tiptapListItem;
        const OrderedList = window.tiptapOrderedList;

        const {
            Editor,
            Node,
            Extension,
            mergeAttributes,
            Document,
            HardBreak,
            Paragraph,
            Text,
            FontFamily,
            Color,
            TextStyle,
            FileHandler,
            generateHTML,
            DragHandle,
            UniqueID,
            Image,
            Resizable
        } = window.tiptap;


        const TaskList = window.tiptapTaskList;
        const TaskItem = window.tiptapTaskItem;
        const Placeholder = window.tiptapPlaceholder;
        const CharacterCount = window.tiptapCharacterCount;
        const BubbleMenu = window.tiptapBubbleMenu;
        const FloatingMenu = window.tiptapFloatingMenu;
        const Link = window.tiptapLink;
        const TextAlign = window.tiptapTextAlign;
        const Highlight = window.tiptapHighlight;
        const Table = window.tiptapTable;
        const TableCell = window.tiptapTableCell;
        const TableHeader = window.tiptapTableHeader;
        const TableRow = window.tiptapTableRow;
        const Underline = window.tiptapUnderline;
        const Youtube = window.tiptapYoutube;

        const Mention = window.tiptapMention;



        instance.data.headings = [];
        properties.headings.split(",").map((item) => {
            instance.data.headings.push(parseInt(item));
        });

        instance.data.active_nodes = properties.nodes
            .split(",")
            .map((item) => item.trim());

        const extensions = [
            Document,
            Paragraph,
            Text,
            ListItem,
            TextStyle,
            CharacterCount.configure({
                limit: properties.characterLimit || null,
            }),
        ];


        if (properties.extension_uniqueid) {
            if (!properties.extension_uniqueid_types) {
                context.reportDebugger("UniqueID extension is active but the types are empty. You could target `paragraph, heading`, for example.");
                return
            }
            let unique_id_types = properties.extension_uniqueid_types.split(",").map((item) => {
                return item.trim()
            })

            if (unique_id_types.length === 0) {
                context.reportDebugger("UniqueID extension is active but there are no types for it to target. You could target `paragraph, heading`, for example.");
                return
            }

            let attributeName = properties.extension_uniqueid_attrName || "id";
            console.log("attributeName", attributeName);

            extensions.push(
                UniqueID.configure({
                    types: unique_id_types,
                    attributeName: attributeName,
                })
            );
        };

        if (instance.data.active_nodes.includes("Dropcursor")) {
            extensions.push(Dropcursor);
        }
        if (instance.data.active_nodes.includes("Gapcursor")) {
            extensions.push(Gapcursor);
        }
        if (instance.data.active_nodes.includes("HardBreak")) {
            extensions.push(HardBreak.configure({
                keepMarks: properties.hardBreakKeepMarks,
            }));
        }
        if (instance.data.active_nodes.includes("History")) {
            extensions.push(History);
        }

        if (instance.data.active_nodes.includes("Bold")) {
            extensions.push(Bold);
        }
        if (instance.data.active_nodes.includes("Italic")) {
            extensions.push(Italic);
        }
        if (instance.data.active_nodes.includes("Strike")) {
            extensions.push(Strike);
        }

        if (instance.data.active_nodes.includes("FontFamily")) {
            extensions.push(FontFamily);
        }

        if (instance.data.active_nodes.includes("Color")) {
            extensions.push(Color);
        }

        if (instance.data.active_nodes.includes("Heading")) {
            extensions.push(Heading.configure({ levels: instance.data.headings }));
        }

        if (instance.data.active_nodes.includes("BulletList")) {
            extensions.push(BulletList);
        }
        if (instance.data.active_nodes.includes("OrderedList")) {
            extensions.push(OrderedList);
        }
        if (instance.data.active_nodes.includes("TaskList")) {
            extensions.push(TaskList, TaskItem.configure({ nested: true }));
        }

        if (instance.data.active_nodes.includes("Mention")) {
            if (!properties.mention_list) {
                console.log(
                    "tried to use Mention extension, but mention_list is empty. Mention extension not loaded"
                );
            } else {
                const suggestion_config = instance.data.configureSuggestion(
                    instance,
                    properties
                );
                // console.log("Mention loaded properly", Mention, typeof Mention);
                extensions.push(
                    Mention.configure({
                        HTMLAttributes: {
                            class: "mention",
                        },
                        renderHTML({ options, node }) {
                            return [
                                "a",
                                mergeAttributes(
                                    { href: `${properties.mention_base_url}${node.attrs.id}` },
                                    options.HTMLAttributes
                                ),
                                `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
                            ];
                        },
                        deleteTriggerWithBackspace: true,
                        suggestion: suggestion_config,
                    })
                );
            }
        }

        if (instance.data.active_nodes.includes("Highlight")) {
            extensions.push(Highlight);
        }
        if (instance.data.active_nodes.includes("Underline")) {
            extensions.push(Underline);
        }

        if (instance.data.active_nodes.includes("CodeBlock")) {
            extensions.push(CodeBlock);
        }
        if (instance.data.active_nodes.includes("Code")) {
            extensions.push(Code);
        }

        if (instance.data.active_nodes.includes("Blockquote")) {
            extensions.push(Blockquote);
        }
        if (instance.data.active_nodes.includes("HorizontalRule")) {
            extensions.push(HorizontalRule);
        }
        if (instance.data.active_nodes.includes("Youtube")) {
            extensions.push(Youtube.configure({ nocookie: true }));
        }
        if (instance.data.active_nodes.includes("Table")) {
            extensions.push(
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell
            );
        }
        if (instance.data.active_nodes.includes("Image")) {
            extensions.push(Image.configure({ inline: false, allowBase64: properties.allowBase64 }), Resizable);
        }
        if (instance.data.active_nodes.includes("Link")) {
            extensions.push(Link);
        }
        if (instance.data.active_nodes.includes("Placeholder")) {
            extensions.push(Placeholder.configure({ placeholder: placeholder }));
        }
        if (instance.data.active_nodes.includes("TextAlign")) {
            extensions.push(TextAlign.configure({ types: ["heading", "paragraph"] }));
        }

        const PreserveAttributes = Extension.create({
            name: 'preserveAttributes',

            addGlobalAttributes() {
                return [
                    {
                        // Apply to all block nodes
                        types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem', 'table', 'tableRow', 'tableCell', 'tableHeader'],
                        attributes: {
                            class: {
                                default: null,
                                parseHTML: element => element.getAttribute('class'),
                                renderHTML: attributes => {
                                    if (!attributes.class) return {};
                                    return { class: attributes.class };
                                },
                            },
                            style: {
                                default: null,
                                parseHTML: element => element.getAttribute('style'),
                                renderHTML: attributes => {
                                    if (!attributes.style) return {};
                                    return { style: attributes.style };
                                },
                            },
                            id: {
                                default: null,
                                parseHTML: element => element.getAttribute('id'),
                                renderHTML: attributes => {
                                    if (!attributes.id) return {};
                                    return { id: attributes.id };
                                },
                            },
                            'data-attributes': {
                                default: null,
                                parseHTML: element => {
                                    const dataAttrs = {};
                                    Array.from(element.attributes).forEach(attr => {
                                        if (attr.name.startsWith('data-')) {
                                            dataAttrs[attr.name] = attr.value;
                                        }
                                    });
                                    return Object.keys(dataAttrs).length ? dataAttrs : null;
                                },
                                renderHTML: attributes => {
                                    if (!attributes['data-attributes']) return {};
                                    return attributes['data-attributes'];
                                },
                            }
                        },
                    },
                    {
                        // Apply to inline marks
                        types: ['bold', 'italic', 'strike', 'code', 'link'],
                        attributes: {
                            class: {
                                default: null,
                                parseHTML: element => element.getAttribute('class'),
                                renderHTML: attributes => {
                                    if (!attributes.class) return {};
                                    return { class: attributes.class };
                                },
                            },
                            style: {
                                default: null,
                                parseHTML: element => element.getAttribute('style'),
                                renderHTML: attributes => {
                                    if (!attributes.style) return {};
                                    return { style: attributes.style };
                                },
                            }
                        },
                    }
                ];
            },
        });

        const CustomDivExtension = Node.create({
            name: 'customDiv',
            group: 'block',
            content: 'block*',
            defining: true,

            addAttributes() {
                return {
                    class: {
                        default: null,
                        parseHTML: element => element.getAttribute('class'),
                    },
                    style: {
                        default: null,
                        parseHTML: element => element.getAttribute('style'),
                    },
                    id: {
                        default: null,
                        parseHTML: element => element.getAttribute('id'),
                    },
                    'data-attributes': {
                        default: null,
                      parseHTML: element => {
                            const dataAttrs = {};
                            Array.from(element.attributes).forEach(attr => {
                                if (attr.name.startsWith('data-')) {
                                    dataAttrs[attr.name] = attr.value;
                                }
                            });
                            return Object.keys(dataAttrs).length ? dataAttrs : null;
                        },
                    }
                };
            },

            parseHTML() {
                return [{ tag: 'div' }];
            },

            renderHTML({ node, HTMLAttributes }) {
                const attrs = { ...node.attrs };

                // Merge data attributes
                if (attrs['data-attributes']) {
                    Object.assign(attrs, attrs['data-attributes']);
                    delete attrs['data-attributes'];
                }

                // Remove null/undefined attributes
                Object.keys(attrs).forEach(key => {
                    if (attrs[key] === null || attrs[key] === undefined) {
                        delete attrs[key];
                    }
                });

                return ['div', { ...attrs, ...HTMLAttributes }, 0];
            },
        });



        if (properties.preserve_attributes) {
            extensions.push(PreserveAttributes);

            if (properties.preserve_unknown_tags) {
                // Add custom div support
                extensions.push(CustomDivExtension);
            }
        }



        function handleUpload(file, editor, pos) {
            const attachFilesTo = properties.attachFilesTo || null;
            return new Promise((resolve, reject) => {
                if (!instance.canUploadFile(file)) {
                    const message = "Not allowed to upload this file";
                    context.reportDebugger(message);
                    instance.publishState("fileUploadErrorMessage", message);
                    reject(new Error(message));
                    return;
                }
                if (!properties.attachFilesTo) {
                    context.reportDebugger("Uploading a file, but there's no object to attach to. This file could be accessible by anyone. Consider the privacy implications.");
                }

                instance.publishState("fileUploadProgress", 0);
                const uploadedFile = instance.uploadFile(file, (err, url) => {
                    if (err) {
                        context.reportDebugger(err.message);
                        instance.publishState('fileUploadErrorMessage', err.message);
                        reject(err);
                        return;
                    }

                    if (file.type.startsWith('image/')) {
                        // Insert at the drop position
                        if (pos) {
                            editor.commands.insertContentAt(pos, {
                                type: 'image',
                                attrs: { src: url }
                            });
                        } else {
                            // Fallback to regular image insertion if no position specified
                            editor.commands.setImage({ src: url });
                        }
                    }
                    instance.data.fileUploadUrls.push(url);
                    instance.triggerEvent("fileUploaded");
                    instance.publishState("fileUploadUrls", instance.data.fileUploadUrls);
                    resolve(url);

                }, properties.attachFilesTo, (progress) => {
                    instance.publishState("fileUploadProgress", progress);
                });
            });
        }


        let allowedMimeTypes = undefined;
        if (properties.allowedMimeTypes) {
            allowedMimeTypes = properties.allowedMimeTypes.get(0, properties.allowedMimeTypes.length());
        };

        extensions.push(FileHandler.configure({
            onDrop: async (editor, files, pos) => {
                instance.data.fileUploadUrls = [];
                try {
                    const uploadPromises = Array.from(files).map(file =>
                                                                 handleUpload(file, editor, pos)
                                                                );

                    // Wait for all uploads to complete
                    const urls = await Promise.all(uploadPromises);
                    console.log("urls", urls);
                    instance.publishState("fileUploadUrls", urls);
                } catch (error) {
                    instance.triggerEvent("fileUploadError");
                    console.error("Upload error:", error);
                    context.reportDebugger(error.message);
                    instance.publishState('fileUploadErrorMessage', error.message);
                }
            },

            onPaste: async (editor, files, htmlContent) => {
                instance.data.fileUploadUrls = [];
                if (htmlContent) return
                try {
                    const uploadPromises = Array.from(files).map(file =>
                                                                 handleUpload(file, editor)
                                                                );

                    // Wait for all uploads to complete
                     const urls = await Promise.all(uploadPromises);
                     instance.publishState("fileUploadUrls", urls);
                } catch (error) {
                    instance.triggerEvent("fileUploadError");
                    console.error("Upload error:", error);
                    context.reportDebugger(error.message);
                    instance.publishState('fileUploadErrorMessage', error.message);
                }
            },
            allowedMimeTypes: allowedMimeTypes,
        }));
        
        const parseOptions = {
            preserveWhitespace: preserveWhitespace,
        };
        
        // If attribute preservation is enabled, add custom parsing
        if (properties.preserve_html_attributes) {
            parseOptions.transformPastedHTML = (html) => {
                // Pre-process HTML to ensure better attribute preservation
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Find all div elements and ensure they're properly structured
                const divs = doc.querySelectorAll('div');
                divs.forEach(div => {
                    // Mark divs for preservation
                    if (div.hasAttribute('style') || div.hasAttribute('class')) {
                        div.setAttribute('data-preserve-div', 'true');
                    }
                });
                
                return doc.body.innerHTML;
            };
        }

        let options = {};
        options = {
            element: d,
            editable: properties.isEditable,
            content: content,
            extensions: extensions,
            parseOptions: parseOptions,
            injectCSS: true,
            onCreate({ editor }) {
                instance.data.editor_is_ready = true;
                instance.triggerEvent("is_ready");
                instance.publishState("is_ready", true);

                instance.publishState("contentHTML", editor.getHTML());
                instance.publishState("contentText", editor.getText());
                instance.publishState(
                    "contentJSON",
                    JSON.stringify(instance.data.editor.getJSON())
                );
                instance.publishState("isEditable", editor.isEditable);
                if (instance.data.active_nodes.includes("CharacterCount")) {
                    instance.publishState(
                        "characterCount",
                        editor.storage.characterCount.characters()
                    );
                    instance.publishState(
                        "wordCount",
                        editor.storage.characterCount.words()
                    );
                }
                // window.editor = editor;
                // console.log("onCreate editor", editor);
            },
            onUpdate({ editor }) {
                const contentHTML = editor.getHTML();
                instance.publishState("contentHTML", contentHTML);
                instance.publishState("contentText", editor.getText());
                instance.publishState("contentJSON", JSON.stringify(editor.getJSON()));
                instance.publishState("isEditable", editor.isEditable);
                instance.publishState(
                    "characterCount",
                    editor.storage.characterCount.characters()
                );
                instance.publishState(
                    "wordCount",
                    editor.storage.characterCount.words()
                );

                if (!instance.data.isProgrammaticUpdate) {
                    instance.data.updateContent(contentHTML);
                    instance.data.isDebouncingDone = false;
                }
            },
            onFocus({ editor, event }) {
                instance.triggerEvent("isFocused");
                instance.publishState("isFocused", true);
                instance.data.is_focused = true;
            },
            onBlur({ editor, event }) {
                instance.triggerEvent("isntFocused");
                instance.publishState("isFocused", false);
                instance.data.is_focused = false;
                instance.publishAutobinding(editor.getHTML());
            },
            onTransaction({ editor, transaction }) {
                instance.data.getSelection(editor, properties);

                instance.publishState("bold", editor.isActive("bold"));
                instance.publishState("italic", editor.isActive("italic"));
                instance.publishState("strike", editor.isActive("strike"));
                instance.publishState("h1", editor.isActive("heading", { level: 1 }));
                instance.publishState("h2", editor.isActive("heading", { level: 2 }));
                instance.publishState("h3", editor.isActive("heading", { level: 3 }));
                instance.publishState("h4", editor.isActive("heading", { level: 4 }));
                instance.publishState("h5", editor.isActive("heading", { level: 5 }));
                instance.publishState("h6", editor.isActive("heading", { level: 6 }));
                instance.publishState("body", !editor.isActive("heading"));
                instance.publishState("orderedList", editor.isActive("orderedList"));
                instance.publishState("bulletList", editor.isActive("bulletList"));
                instance.publishState(
                    "sinkListItem",
                    editor.can().sinkListItem("listItem")
                );
                instance.publishState(
                    "liftListItem",
                    editor.can().liftListItem("listItem")
                );
                instance.publishState("blockquote", editor.isActive("blockquote"));
                instance.publishState("codeBlock", editor.isActive("codeBlock"));
                instance.publishState("taskList", editor.isActive("taskList"));
                instance.publishState("taskItem", editor.isActive("taskItem"));
                instance.publishState("link", editor.isActive("link"));
                instance.publishState("url", editor.getAttributes("link").href);
                instance.publishState(
                    "align_left",
                    editor.isActive({ textAlign: "left" })
                );
                instance.publishState(
                    "align_center",
                    editor.isActive({ textAlign: "center" })
                );
                instance.publishState(
                    "align_right",
                    editor.isActive({ textAlign: "right" })
                );
                instance.publishState(
                    "align_justified",
                    editor.isActive({ textAlign: "justify" })
                );
                instance.publishState("highlight", editor.isActive("highlight"));
                instance.publishState("underline", editor.isActive("underline"));
                instance.publishState("table", editor.isActive("table"));

                const textStyle = editor.getAttributes("textStyle");
                if (textStyle && textStyle.color) {
                    const color = textStyle.color;
                    try {
                        const hexColor = instance.data.rgbToHex(color);
                        instance.data.textStyleColor = hexColor;
                    } catch (error) {
                        console.warn(`Failed to convert color to hex: ${color}`, error);
                        instance.data.textStyleColor = color; // Fallback to original color value
                    }
                } else {
                    instance.data.textStyleColor = "";
                }
                instance.publishState("color", instance.data.textStyleColor);

                if (textStyle && textStyle.fontFamily) {
                    instance.publishState("font_family", textStyle.fontFamily);
                } else {
                    instance.publishState("font_family", "");
                }

                instance.publishState(
                    "characterCount",
                    editor.storage.characterCount.characters()
                );
                instance.publishState(
                    "wordCount",
                    editor.storage.characterCount.words()
                );
            },
            onSelectionUpdate({ editor }) {
                instance.data.getSelection(editor, properties);


                instance.publishState("bold", editor.isActive("bold"));
                instance.publishState("italic", editor.isActive("italic"));
                instance.publishState("strike", editor.isActive("strike"));
                instance.publishState("h1", editor.isActive("heading", { level: 1 }));
                instance.publishState("h2", editor.isActive("heading", { level: 2 }));
                instance.publishState("h3", editor.isActive("heading", { level: 3 }));
                instance.publishState("h4", editor.isActive("heading", { level: 4 }));
                instance.publishState("h5", editor.isActive("heading", { level: 5 }));
                instance.publishState("h6", editor.isActive("heading", { level: 6 }));
                instance.publishState("orderedList", editor.isActive("orderedList"));
                instance.publishState("bulletList", editor.isActive("bulletList"));
                instance.publishState(
                    "sinkListItem",
                    editor.can().sinkListItem("listItem")
                );
                instance.publishState(
                    "liftListItem",
                    editor.can().liftListItem("listItem")
                );
                instance.publishState("blockquote", editor.isActive("blockquote"));
                instance.publishState("codeBlock", editor.isActive("codeBlock"));
                instance.publishState("taskList", editor.isActive("taskList"));
                instance.publishState("taskItem", editor.isActive("taskItem"));
                instance.publishState("link", editor.isActive("link"));
                instance.publishState("url", editor.getAttributes("link").href);
                instance.publishState(
                    "align_left",
                    editor.isActive({ textAlign: "left" })
                );
                instance.publishState(
                    "align_center",
                    editor.isActive({ textAlign: "center" })
                );
                instance.publishState(
                    "align_right",
                    editor.isActive({ textAlign: "right" })
                );
                instance.publishState(
                    "align_justified",
                    editor.isActive({ textAlign: "justify" })
                );
                instance.publishState("highlight", editor.isActive("highlight"));
                instance.publishState("underline", editor.isActive("underline"));
                instance.publishState("table", editor.isActive("table"));

                const textStyle = editor.getAttributes("textStyle");

                if (textStyle && textStyle.color) {
                    const color = textStyle.color;
                    try {
                        const hexColor = instance.data.rgbToHex(color);
                        instance.data.textStyleColor = hexColor;
                    } catch (error) {
                        console.warn(`Failed to convert color to hex: ${color}`, error);
                        instance.data.textStyleColor = color; // Fallback to original color value
                    }
                } else {
                    instance.data.textStyleColor = "";
                }
                instance.publishState("color", instance.data.textStyleColor);

                if (textStyle && textStyle.fontFamily) {
                    instance.publishState("font_family", textStyle.fontFamily);
                } else {
                    instance.publishState("font_family", "");
                }
            },
        };

        const menuErrorMessage =
              " not found. Is the entered id correct? FYI: the Bubble element should default to visible.";

        if (bubbleMenu && instance.data.active_nodes.includes("BubbleMenu")) {
            let bubbleMenuTheme = properties.bubbleMenuTheme;

            // Find all elements with the id matching properties.bubbleMenu
            let bubbleMenuElements = document.querySelectorAll(`#${bubbleMenu}`);

            // If no elements found, log an error
            if (bubbleMenuElements.length === 0) {
                const errorMessage = "BubbleMenu" + menuErrorMessage;
                context.reportDebugger(errorMessage);
                console.log(errorMessage);
            } else if (bubbleMenuElements.length === 1) {
                // If only one element is found, make that the bubble menu.
                options.extensions.push(
                    BubbleMenu.configure({
                        element: bubbleMenuElements[0],
                        tippyOptions: {
                            theme: bubbleMenuTheme,
                        },
                    })
                );
            } else if (bubbleMenuElements.length >= 2) {
                // If multiple elements found, try to find the closest and warn the developer
                const errorMessage = `Bubble Menu: found multiple elements with the same ID ${bubbleMenu}. Assuming that the closest one is the correct one. However, the developer should update the code to ensure that the IDs are unique. Tiptap ID: ${instance.data.randomId}.`;
                context.reportDebugger(errorMessage);
                console.log(errorMessage, `Tiptap ID: ${instance.data.randomId}`);
                let bubbleMenuDiv = instance.data.findElement(bubbleMenu);
                options.extensions.push(
                    BubbleMenu.configure({
                        element: bubbleMenuDiv,
                        tippyOptions: {
                            theme: bubbleMenuTheme,
                        },
                    })
                );
            }
        }

        if (floatingMenu && instance.data.active_nodes.includes("FloatingMenu")) {
            let floatingMenuTheme = properties.floatingMenuTheme;

            // Find all elements with the id matching properties.floatingMenu
            let floatingMenuElements = document.querySelectorAll(`#${floatingMenu}`);

            // If no elements found, log an error
            if (floatingMenuElements.length === 0) {
                const errorMessage = "FloatingMenu" + menuErrorMessage;
                context.reportDebugger(errorMessage);
                console.log(errorMessage);
            } else if (floatingMenuElements.length === 1) {
                // If only one element is found, make that the floating menu.
                options.extensions.push(
                    FloatingMenu.configure({
                        element: floatingMenuElements[0],
                        tippyOptions: {
                            theme: floatingMenuTheme,
                        },
                    })
                );
            } else if (floatingMenuElements.length >= 2) {
                // If multiple elements found, try to find the closest and warn the developer
                const errorMessage = `Floating Menu: found multiple elements with the same ID ${floatingMenu}. Assuming that the closest one is the correct one. However, the developer should update the code to ensure that the IDs are unique. Tiptap ID: ${instance.data.randomId}.`;
                context.reportDebugger(errorMessage);
                console.log(errorMessage, `Tiptap ID: ${instance.data.randomId}`);
                let floatingMenuDiv = instance.data.findElement(floatingMenu);
                options.extensions.push(
                    FloatingMenu.configure({
                        element: floatingMenuDiv,
                        tippyOptions: {
                            theme: floatingMenuTheme,
                        },
                    })
                );
            }
        }

        instance.data.maybeSetupCollaboration(
            instance,
            properties,
            options,
            extensions
        );

        try {
            instance.data.editor = new Editor(options);
            instance.data.isEditorSetup = true;

        } catch (error) {
            console.log("failed trying to create the Editor", error);
        }
    }
    /*

    END OF INITIAL LOAD

    */



    if (
        !!instance.data.editor_is_ready &&
        properties.isEditable != instance.data.editor.isEditable
    ) {
        let isEditable = properties.isEditable;
        instance.data.editor.setEditable(isEditable);
    }

    if (
        instance.data.editor_is_ready &&
        properties.initialContent !== "" &&
        instance.data.initialContent !== properties.initialContent &&
        !properties.bubble.auto_binding()
    ) {
        console.log("content has changed");

        if (!properties.collab_active) {
            instance.data.initialContent = properties.initialContent;
            let content = properties.content_is_json
            ? JSON.parse(instance.data.initialContent)
            : instance.data.initialContent;

            // Clear any pending debounce timeout before programmatic update
            clearTimeout(instance.data.debounceTimeout);

            instance.data.editor.commands.setContent(content, true);
        } else {
            console.log(
                "initialContent has changed but collaboration is active -- not updating content"
            );
        }
    }

    if (
        instance.data.editor_is_ready &&
        instance.data.delay !== properties.update_delay
    ) {
        console.log(
            "Updating debounce delay from the standard " +
            instance.data.delay +
            "ms to " +
            properties.update_delay +
            "ms"
        );
        instance.data.delay = properties.update_delay;
    }

    if (
        instance.data.editor_is_ready &&
        properties.bubble.auto_binding() &&
        instance.data.isDebouncingDone &&
        properties.autobinding !== instance.data.editor.getHTML()
    ) {
        // Clear any pending debounce timeout before programmatic update
        clearTimeout(instance.data.debounceTimeout);
        let editor = instance.data.editor;

        editor.commands.setContent(properties.autobinding, false);
        const contentHTML = editor.getHTML();
        instance.publishState("contentHTML", contentHTML);
        instance.publishState("contentText", editor.getText());
        instance.publishState("contentJSON", JSON.stringify(editor.getJSON()));
        instance.publishState("isEditable", editor.isEditable);
        instance.publishState(
            "characterCount",
            editor.storage.characterCount.characters()
        );
        instance.publishState("wordCount", editor.storage.characterCount.words());
    }

    if (!!instance.data.editor_is_ready) {
        if (!properties.bubble.fit_height()) {
            instance.canvas.css({ overflow: "scroll" });
        } else {
            instance.canvas.css({ overflow: "auto" });
        }
    }

    if (!!instance.data.editor_is_ready && !!properties.collab_active) {
        instance.data.editor.commands.updateUser({
            name: properties.collab_user_name,
            color: properties.collab_cursor_color,
        });
    }

   instance.data.stylesheet.innerHTML = `
#tiptapEditor-${instance.data.randomId} {


    .ProseMirror {



        h1 {
            font-size: ${properties.h1_size};
            color: ${properties.h1_color};
            margin: ${properties.h1_margin};
            font-weight: ${properties.h1_font_weight};
            ${properties.h1_adv}
        }

		h2 {
            font-size: ${properties.h2_size};
            color: ${properties.h2_color};
            margin: ${properties.h2_margin};
            font-weight: ${properties.h2_font_weight};
            ${properties.h2_adv}
		}

		h3 {
            font-size: ${properties.h3_size};
            color: ${properties.h3_color};
            margin: ${properties.h3_margin};
            font-weight: ${properties.h3_font_weight};
            ${properties.h3_adv}
        }

		h4 {
            font-size: ${properties.h4_size};
            color: ${properties.h4_color};
            margin: ${properties.h4_margin};
            font-weight: ${properties.h4_font_weight};
            ${properties.h4_adv}
        }

        h5 {
            font-size: ${properties.h5_size};
            color: ${properties.h5_color};
            margin: ${properties.h5_margin};
            font-weight: ${properties.h5_font_weight};
            ${properties.h5_adv}
        }

        h6 {
            font-size: ${properties.h6_size};
            color: ${properties.h6_color};
            margin: ${properties.h6_margin};
            font-weight: ${properties.h6_font_weight};
            ${properties.h6_adv}
        }

        p {
            font-size: ${properties.bubble.font_size()};
            color: ${properties.bubble.font_color()};
            font-family: ${properties.bubble.font_face().match(/^(.*?):/)[1]};
            margin: 1rem 0;
            font-weight: 400;
            ${properties.p_adv}
		}

        p.is-editor-empty:first-child::before {
            color: ${properties.placeholder_color || "#adb5bd"};
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
        }

        mark {
	        ${properties.mark_adv || ""}
        }

        a {
            text-decoration: underline;
            cursor: pointer;
            ${properties.link_adv}
        }

        a:link {
            color: ${properties.link_color};
            ${properties.link_unvisited_adv}
        }

        a:visited {
            color: ${properties.link_color_visited};
            ${properties.link_visited_adv}
        }

        a:focus {
	        ${properties.link_focus_adv}
        }

        a:hover {
            color: ${properties.link_color_hover};
            ${properties.link_hover_adv};
        }

	        a:active {
        }

        iframe {
	        ${properties.iframe}
        }

        img {
    	    ${properties.image_css}
        }

		blockquote {
        	${properties.blockquote_adv}
        }

		ul[data-type="taskList"] {
            list-style: none;
            padding: 0;
        }

		ul[data-type="taskList"] p {
        	margin: 0;
        }

		ul[data-type="taskList"] li {
        	display: flex;
        }

		ul[data-type="taskList"] li > label {
            flex: 0 0 auto;
            margin-right: 0.5rem;
            user-select: none;
        }

		ul[data-type="taskList"] li > div {
        	flex: 1 1 auto;
        }

		ul:not([data-type="taskList"]) {
        	${properties.ul_adv}
        }

		ol {
        	${properties.ol_adv}
        }

		table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            text-indent: 0;
        }
		th, td {
            padding: ${properties.table_th_td_padding};
            text-align: start;
            border-bottom: ${properties.table_th_td_border_bottom} ${properties.table_row_border_color};
        }

		th {
            font-weight: ${properties.table_th_font_weight};
            text-align: left;
            background: ${properties.table_th_background};
        }

		th * {
            color: ${properties.table_header_font_color};
            font-weight: ${properties.table_th_font_weight};
        }

		tr:nth-of-type(odd) {
        	background: ${properties.table_zebra_background};
        }

        .tiptap-drag-handle {
          align-items: center;
          background: black;
          border-radius: .25rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          cursor: grab;
          display: flex;
          height: 1.5rem;
          justify-content: center;
          width: 1.5rem;

        }




            ${properties.baseDiv || ""}

    }

    .mention {
        border: 1px solid;
        border-color: ${properties.mention_border_color};
        background-color: ${properties.mention_background_color || "transparent"};
        border-radius: 0.4rem;
        padding: 0.1rem 0.3rem;
        box-decoration-break: clone;
    }

    .suggestions {
        border: 1px solid #ccc;
        background-color: white;
        padding: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border-radius: 4px;
        display: block; /* make sure it is visible */
        position: absolute;
        z-index: 1000; /* Ensure it is on top */
    }

    .suggestion-item {
        padding: 8px 10px;
        cursor: pointer;
        list-style: none;
    }

    .suggestion-item:hover {
	    background-color: #eee;
    }

    .suggestion {
        background-color: black;
        color: white;
    }
}



.selectedCell:after {
    z-index: 2;
    position: absolute;
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(200, 200, 255, 0.4);
    pointer-events: none;
}

.column-resize-handle {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: -2px;
    width: 4px;
    background-color: #adf;
    pointer-events: none;
}

.tableWrapper {
    overflow-x: auto;
}

.resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
}



.collaboration-cursor__caret {
    position: relative;
    margin-left: -1px;
    margin-right: -1px;
    border-left: 1px solid #0D0D0D;
    border-right: 1px solid #0D0D0D;
    word-break: normal;
    pointer-events: none;
}

.collaboration-cursor__label {
    position: absolute;
    top: -1.4em;
    left: -1px;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    user-select: none;
    color: #0D0D0D;
    padding: 0.1rem 0.3rem;
    border-radius: 3px 3px 3px 0;
    white-space: nowrap;
}

.items_${instance.data.randomId} {
    padding: 0.2rem;
    position: relative;
    border-radius: 0.5rem;
    background: #FFF;
    color: rgba(0, 0, 0, 0.8);
    overflow: hidden;
    font-size: 0.9rem;
    box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0px 10px 20px rgba(0, 0, 0, 0.1);

    .item {
        display: block;
        margin: 0;
        width: 100%;
        text-align: left;
        background: transparent;
        border-radius: 0.4rem;
        border: 1px solid transparent;
        padding: 0.2rem 0.4rem;

        &.is-selected {
        	border-color: #000;
        }
    }
}
`;



}
