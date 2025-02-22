export default {
  itemEditable: function (item) {
    if (item.isFeedItem) {
      Zotero.debug("skip feed item");
      return false;
    }
    let collections = item.getCollections();
    for (let collection of collections) {
      let libraryID = Zotero.Collections.get(collection).libraryID;
      if (libraryID) {
        let library = Zotero.Libraries.get(libraryID);
        if (library && !library.editable) {
          return false;
        }
      }
    }
    return true;
  },
  updateItem: async function (item, operation, tags, userTag = false) {
    Zotero.debug("ZoteroTag: Updating item: " + JSON.stringify(item));
    Zotero.debug(operation, tags);
    let updateCount = 0;
    for (let i = 0; i < tags.length; ++i) {
      if (operation === "add" && !item.hasTag(tags[i])) {
        item.addTag(tags[i], userTag ? 0 : 1);
        updateCount += 1;
      } else if (operation === "remove" && item.hasTag(tags[i])) {
        item.removeTag(tags[i]);
        updateCount += 1;
      } else if (operation === "change") {
        if (item.hasTag(tags[i])) {
          item.removeTag(tags[i]);
        } else {
          item.addTag(tags[i], userTag ? 0 : 1);
        }
        updateCount += 1;
      }
      await item.saveTx();
    }
    return updateCount;
  },
  updateItems: async function (
    items,
    operation,
    tags,
    userTag = false,
    addtionInfo = ""
  ) {
    items = items.filter((i) => Zotero.ZoteroTag.itemEditable(i));
    // If we don't have any items to update, just return.
    if (items.length === 0 || tags.length === 0) {
      return;
    }
    Zotero.debug("ZoteroTag: Updating items: " + JSON.stringify(items) + tags);
    // Object.keys(items).forEach(function(key){
    // 	Zotero.debug(items[key])
    // });
    // Add/Remove is finished
    let infoOperation =
      operation == "change" && items.length == 1 && tags.length == 1
        ? items[0].hasTag(tags[0])
          ? "remove"
          : "add"
        : operation;
    const infoBody = `${infoOperation} ${
      tags.length > 3 || tags.length === 0
        ? String(tags.length) + " tags"
        : tags
    }`;
    const progress = Zotero.ZoteroTag.showProgressWindow(
      "[Pending] Zotero Tag",
      `[0/${items.length}] ${infoBody} ${addtionInfo}`,
      "success",
      -1
    );
    progress.progress.setProgress(1);
    let t = 0;
    // Wait for ready
    while (!progress.progress._itemText && t < 100) {
      t += 1;
      await Zotero.Promise.delay(10);
    }
    let doneCount = 0;
    let skipCount = 0;
    for (const item of items) {
      const updatedCount = await Zotero.ZoteroTag.updateItem(
        item,
        operation,
        tags,
        userTag
      );
      updatedCount > 0 ? (doneCount += 1) : (skipCount += 1);
      console.log(progress.progress._itemText);
      Zotero.ZoteroTag.changeProgressWindowDescription(
        progress,
        `[${doneCount}/${items.length}]${
          skipCount > 0 ? `(${skipCount} skipped)` : ""
        } ${infoBody} ${addtionInfo}`
      );
      progress
        ? progress.progress.setProgress((doneCount / items.length) * 100)
        : null;
    }
    console.log(progress);
    if (progress) {
      progress.progress.setProgress(100);
      progress.changeHeadline("[Done] Zotero Tag");
      progress.startCloseTimer(5000);
    }
  },

  updateSelectedEntity: function (operation = "add", group = undefined) {
    Zotero.debug("ZoteroTag: Updating items in entity");
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage();
      return;
    }

    var collection = ZoteroPane.getSelectedCollection(false);

    if (collection) {
      Zotero.debug(
        "ZoteroTag: Updating items in entity: Is a collection == true"
      );
      var items = [];
      collection.getChildItems(false, false).forEach(function (item) {
        items.push(item);
      });
      suppress_warnings = true;
      const tags = Zotero.ZoteroTag.getTagByGroup(group);
      Zotero.ZoteroTag.updateItems(
        items,
        operation,
        tags.filter((tag) => tag.slice(0, 2) !== "~~")
      );
      Zotero.ZoteroTag.updateItems(
        items,
        "remove",
        tags
          .filter((tag) => tag.slice(0, 2) === "~~")
          .map((tag) => tag.slice(2))
      );
    }
  },
  updateSelectedItems: async function (operation = "add", group = undefined) {
    Zotero.debug("ZoteroTag: Updating Selected items");

    if (Zotero_Tabs.selectedID == "zotero-pane") {
      let tags = [];
      let userTag = false;
      if (typeof group === "undefined") {
        // return prompt("Enter tags, split by ',':", "").split(",");
        const io = {
          dataIn: null,
          dataOut: {},
          deferred: Zotero.Promise.defer(),
        };

        window.openDialog(
          "chrome://zoterotag/content/manual.xul",
          "",
          "chrome,centerscreen,width=500,height=200",
          io
        );
        await io.deferred.promise;
        operation = io.dataOut.operation;
        tags = io.dataOut.tags;
        userTag = io.dataOut.userTag;
        if (!tags) {
          return;
        }
      } else {
        tags = Zotero.ZoteroTag.getTagByGroup(Number(group));
      }
      let items = ZoteroPane.getSelectedItems();
      Zotero.ZoteroTag.updateItems(
        items,
        operation,
        tags.filter((tag) => tag.slice(0, 2) !== "~~"),
        userTag
      );
      Zotero.ZoteroTag.updateItems(
        items,
        "remove",
        tags
          .filter((tag) => tag.slice(0, 2) === "~~")
          .map((tag) => tag.slice(2))
      );
    } else {
      Zotero.ZoteroTag.updateAnnotation(operation, Number(group));
    }
  },
  updateAction: function (items, action) {
    let tags = Zotero.ZoteroTag.getTagsByEvent(action.event);
    for (let operation in tags) {
      Zotero.ZoteroTag.updateItems(items, operation, tags[operation]);
    }
  },
  updateAnnotation: function (operation, group) {
    let currentReader = Zotero.ZoteroTag.getReader();
    if (!currentReader) {
      return;
    }
    // Get selected annotation
    let annot = currentReader._iframeWindow.document.querySelector(
      ".annotation.selected"
    );
    if (!annot) {
      Zotero.ZoteroTag.showProgressWindow(
        "FAIL",
        "No annotation selected.",
        "fail"
      );
      return;
    }
    let annotKey = annot.getAttribute("data-sidebar-annotation-id");
    const item = Zotero.Items.get(currentReader.annotationItemIDs).find(
      (_i) => _i.key === annotKey
    );
    let tags = Zotero.ZoteroTag.getTagByGroup(group);
    Zotero.ZoteroTag.updateItems(
      [item],
      operation,
      tags.filter((tag) => tag.slice(0, 2) !== "~~")
    );
    Zotero.ZoteroTag.updateItems(
      [item],
      "remove",
      tags.filter((tag) => tag.slice(0, 2) === "~~").map((tag) => tag.slice(2))
    );
    return true;
  },
};
