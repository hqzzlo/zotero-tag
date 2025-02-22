initZTagPreferences = function () {
  let rules = Zotero.ZoteroTag.rules();
  Zotero.debug("ZoteroTag: Initialize preferences.");
  Zotero.debug(rules);
  refreshPreferencesView(rules);
};

resetZTagPreferences = function () {
  Zotero.debug("ZoteroTag: Reset preferences.");
  let rules = Zotero.ZoteroTag.resetRules();
  Zotero.debug(rules);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("SUCCESS", "ZoteroTag rules reset.");
};

addRule = function () {
  Zotero.debug("ZoteroTag: Add rule.");
  let rule = {};
  rule.id = -1;
  const tags = document
    .getElementById(`zoterotag-rules-#-tags`)
    .value.split(",");
  rule.tags = tags.filter((tag) => tag.slice(0, 2) !== "~~");
  rule.untags = tags
    .filter((tag) => tag.slice(0, 2) === "~~")
    .map((tag) => tag.slice(2));
  rule.group = document.getElementById("zoterotag-rules-#-group").value;
  let selected = document.getElementById(
    "zoterotag-rules-#-actions"
  ).selectedIndex;
  if (Zotero.ZoteroTag.availableActions[selected]) {
    rule.actions = [Zotero.ZoteroTag.availableActions[selected]];
  } else {
    rule.actions = [];
  }
  Zotero.debug(rule);
  let rules = Zotero.ZoteroTag.addRule(rule);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow(
    "SUCCESS",
    "New ZoteroTag rule modification saved."
  );
};

refreshRule = function (id) {
  Zotero.debug("ZoteroTag: Refresh rule.");
  let rule = {};
  rule.id = Number(id);
  const tags = document
    .getElementById(`zoterotag-rules-${id}-tags`)
    .value.split(",");
  rule.tags = tags.filter((tag) => tag.slice(0, 2) !== "~~");
  rule.untags = tags
    .filter((tag) => tag.slice(0, 2) === "~~")
    .map((tag) => tag.slice(2));
  rule.group = document.getElementById(`zoterotag-rules-${id}-group`).value;
  let selected = document.getElementById(
    `zoterotag-rules-${id}-actions`
  ).selectedIndex;
  if (Zotero.ZoteroTag.availableActions[selected]) {
    rule.actions = [Zotero.ZoteroTag.availableActions[selected]];
  } else {
    rule.actions = [];
  }
  Zotero.debug(rule);
  let rules = Zotero.ZoteroTag.replaceRule(rule, id);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow(
    "SUCCESS",
    "ZoteroTag rule modification updated."
  );
};

removeRule = function (id) {
  Zotero.debug("ZoteroTag: Refresh rule.");
  let rules = Zotero.ZoteroTag.removeRule(id);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("SUCCESS", "ZoteroTag rule removed.");
};

refreshPreferencesView = function (rules) {
  let listbox = document.getElementById("zoterotag-rules-listbox");
  let e,
    es = document.getElementsByTagName("listitem");
  while (es.length > 0) {
    e = es[0];
    e.parentElement.removeChild(e);
  }
  listbox.removeChild;
  for (let key in rules) {
    listbox.appendChild(creatRuleListElement(rules[key]));
  }
  listbox.appendChild(creatRuleBlankListElement());
  // Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'ZoteroTag preference view updated.')
};

creatRuleBlankListElement = function () {
  let rule = {
    id: "#",
    tags: ["MODIFY HERE"],
    untags: [],
    actions: [],
    group: 1,
    addcmd: "addRule()",
    addtext: "➕",
    hideRemove: true,
  };
  return creatRuleListElement(rule);
};

creatRuleListElement = function (rule) {
  let listIDHead = "zoterotag-rules";
  let listitem,
    listcell,
    label,
    textbox,
    menulist,
    menupopup,
    menuitem,
    checkbox,
    button;

  listitem = document.createElement("listitem");
  listitem.setAttribute("id", `${listIDHead}-${rule.id}`);
  listitem.setAttribute("allowevents", "true");

  listcell = document.createElement("listcell");
  label = document.createElement("label");
  label.setAttribute("id", `${listIDHead}-${rule.id}-id`);
  label.setAttribute("value", rule.id);
  listcell.appendChild(label);
  listitem.appendChild(listcell);

  const tags = rule.tags.concat(
    rule.untags ? rule.untags.map((tag) => `~~${tag}`) : []
  );
  listcell = document.createElement("listcell");
  textbox = document.createElement("textbox");
  textbox.setAttribute("id", `${listIDHead}-${rule.id}-tags`);
  textbox.setAttribute("value", `${tags}`);
  textbox.setAttribute("style", "width: 190px");
  listcell.appendChild(textbox);
  listitem.appendChild(listcell);

  listcell = document.createElement("listcell");
  menulist = document.createElement("menulist");
  menulist.setAttribute("id", `${listIDHead}-${rule.id}-group`);
  menupopup = document.createElement("menupopup");
  for(const i of Object.keys(Zotero.ZoteroTag.availableShortcuts)){
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", i);
    menuitem.setAttribute("label", Zotero.ZoteroTag.availableShortcuts[i]);
    menupopup.appendChild(menuitem);
  }
  menulist.setAttribute("value", `${rule.group}`);
  menulist.appendChild(menupopup);
  listcell.appendChild(menulist);
  listitem.appendChild(listcell);

  listcell = document.createElement("listcell");
  menulist = document.createElement("menulist");
  menulist.setAttribute("id", `${listIDHead}-${rule.id}-actions`);
  menupopup = document.createElement("menupopup");
  menuValueList = [];
  menuLabelList = [];
  let selected = undefined;
  for (let i = 0; i < Zotero.ZoteroTag.availableActions.length; i++) {
    let op = Zotero.ZoteroTag.availableActions[i].operation;
    let ev = Zotero.ZoteroTag.availableActions[i].event;
    menuValueList.push(i);
    menuLabelList.push(`${op} on item ${ev}`);
    if (
      rule.actions &&
      rule.actions.length &&
      rule.actions[0].operation == op &&
      rule.actions[0].event == ev
    ) {
      selected = i;
    }
  }
  menuValueList.push(Zotero.ZoteroTag.availableActions.length);
  menuLabelList.push("disabled");
  // Select the last element
  if (typeof selected == "undefined") {
    selected = menuValueList.length - 1;
  }
  for (let i = 0; i < menuValueList.length; i++) {
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", menuValueList[i]);
    menuitem.setAttribute("label", menuLabelList[i]);
    menupopup.appendChild(menuitem);
  }
  // menulist.setAttribute("value", `${rule.group}`);
  menulist.appendChild(menupopup);
  menulist.setAttribute("value", selected);
  listcell.appendChild(menulist);
  listitem.appendChild(listcell);

  listcell = document.createElement("listcell");
  button = document.createElement("button");
  button.setAttribute("label", rule.addtext ? rule.addtext : "✅");
  button.setAttribute("tooltiptext", "Add/Refresh Rule");
  button.setAttribute(
    "oncommand",
    rule.addcmd ? rule.addcmd : `refreshRule("${rule.id}")`
  );
  button.style.maxWidth = "30px";
  button.style.minWidth = "30px";
  button.style.width = "30px";
  listcell.appendChild(button);
  // listitem.appendChild(listcell);

  // listcell = document.createElement("listcell");
  if (!rule.hideRemove) {
    button = document.createElement("button");
    button.setAttribute("label", rule.removetext ? rule.removetext : "⛔");
    button.setAttribute("tooltiptext", "Remove Rule");
    button.setAttribute(
      "oncommand",
      rule.removecmd ? rule.removecmd : `removeRule("${rule.id}")`
    );
    button.style.maxWidth = "30px";
    button.style.minWidth = "30px";
    button.style.width = "30px";
    listcell.appendChild(button);
  }
  listitem.appendChild(listcell);

  return listitem;
};
