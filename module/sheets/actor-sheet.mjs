import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class shiverActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shiver", "sheet", "actor"],
      template: "systems/shiver/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /** @override */
  get template() {
    return `systems/shiver/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system= actorData.system;
    context.flags = actorData.flags;
    // Prepare character data and items.
    if (actorData.type == 'character') {
      await this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      await this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);
    context.enrichBio = await TextEditor.enrichHTML(actorData.system.biography, {async: true});

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.shiver.abilities[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const traits = [];
    const powers = [];

    // Iterate through items, allocating to containers
    for (let index = 0; index < context.items.length; index++)
    {
      let i = context.items[index];
      i.enrichDescription = await TextEditor.enrichHTML(i.system.description, { async:  true });
      i.img = context.items[index].img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item' || i.type === "weapon" || i.type === "armour") {
        gear.push(i);
      }
      // Append to trait
      else if (i.type === 'trait') {
        traits.push(i);
      }
      // Append to spells.
      else if (i === 'power') {
          powers.push(i);
        }
      }
    // Assign and return
    context.gear = gear;
    context.traits = traits;
    context.powers = powers;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    //console.log("Active listeneres");
    
    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.find('.item-chat').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      let html;
      if(item.type === "weapon"){
      html = `<hr><h3>WEAPON  [${item.name}]</h3>
              <h4>Skill: ${item.system.skill}</h4>
              <h4>Range: ${item.system.range}</h4>
              <h4>Damage: ${item.system.damage} ${item.system.damagetype} </h4><hr>
              <span>${ item.system.description}</span>`
      }else if(item.type === "power"){
      html = `<hr><h3>POWER  [${item.name}]</h3>
        <h4>Skill: ${item.system.skill}</h4>
        <h4>Range: ${item.system.range}</h4>
        <h4>Damage: ${item.system.damage} ${item.system.damagetype} </h4><hr>
        <span>${item.system.description}</span>`
      }else if(item.type === "armour"){
      html =  `<hr><h3>ARMOUR  [${item.name}] HP: ${item.system.hp}</h3>
      <span>${item.system.description}</span>`
      }else{
      html = `<hr><h3>${item.name}</h3>
      <span>${item.system.description}</span>`
      }
      ChatMessage.create({
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        content: html
      });
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Checkbox (fear) events 
    html.find(".checkbox-fear").click(this._onCheckFear.bind(this));

    // lifeline
    html.find(".health").change(this._onUpdateHealth.bind(this));

    // Hide/show description on character sheet
    html.find(".togglable-description").click(this._onToggleDescription.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rolltype) {
      if (dataset.rolltype == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        //if (item) return item.roll();
        if(item)
        {
          let m_skill = item.system.skill.toLowerCase();
          let rSkill = this.actor.system.abilities[m_skill].skill.value;
          let rTalent = this.actor.system.abilities[m_skill].talent.value;
          rollDialog(this.actor,dataset.skillroll,rSkill,rTalent);
        }
        return;
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    if (dataset.skillroll) {
      rollDialog(this.actor,dataset.skillroll,dataset.skilldice,dataset.talentdice);
    }
  }

  _onCheckFear(event) {
    const element = event.currentTarget;
    const el_circle = $(element).find("i")[0];
    const dataset = element.dataset;
    const target = dataset.target;
    const actorData = duplicate(this.actor);


    switch(dataset.status){
      case("stable"):
      actorData.system.attributes["fear-level"].icon.stable = "far fa-times-circle";
      actorData.system.attributes["fear-level"].icon.afraid = "far fa-circle";
      actorData.system.attributes["fear-level"].icon.terrified = "far fa-circle";
      break;
      case("afraid"):
      actorData.system.attributes["fear-level"].icon.stable = "far fa-circle";
      actorData.system.attributes["fear-level"].icon.afraid = "far fa-times-circle";
      actorData.system.attributes["fear-level"].icon.terrified = "far fa-circle";
      break;
      case("terrified"):
      actorData.system.attributes["fear-level"].icon.stable = "far fa-circle";
      actorData.system.attributes["fear-level"].icon.afraid = "far fa-circle";
      actorData.system.attributes["fear-level"].icon.terrified = "far fa-times-circle";
      break;
    }

    this.actor.update(actorData);
    this.actor.sheet.render(true);
  }

  _onUpdateHealth(event){
    let hp = event.target.value;
    hp = (hp > 16) ? 16 : hp;
    const actorData = duplicate(this.actor);
    actorData.system.hp.value = hp;
    for(let i=0; i < 16; ++i)
    {
      actorData.system.attributes.lifeline[15-i] = !((i) < hp); 
    }
    this.actor.update(actorData);
    this.actor.sheet.render(true);
  }

  async _onToggleDescription(event){
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    //const itemCopy = duplicate(item); 
    if (item){
      if(item.system.display == "none"){
        item.system.display = "block";
      }else{
        item.system.display = "none";
      }
    }
    this.actor.sheet.render(true);
/*
        const target = dataset.target;

    const actorData = duplicate(this.actor);
    if(actorData.system[target] == "block;")
    {
      actorData.system[target] = "none;";
    }
    else
    {
      actorData.system[target] = "block;";
    }
    this.actor.update(actorData);
    this.actor.sheet.render(true);
    */
  }
}



let rollDialog = (actor,skill,skillDice,talentDice) => {

  let html_content = `
<form id='myform'>
  <div class="flexrow">
    <div class="flexcol">
      <h3>
        <label for="skill">Choose a Skill</label>
      </h3>
        <select id="skill" name="skillSelection" form="skillform">
            <option value="grit">Grit</option>
            <option value="wit">Wit</option>
            <option value="smarts">Smarts</option>
            <option value="heart">Heart</option>
            <option value="luck">Luck</option>
            <option value="strange">Strange</option>
        </select>

      <label>
        Skill Dice Pool [D6]
        <input type='number' name='skillPool' value='0' />
      </label>

      <label>
        Talent Dice Pool [D8]
        <input type='number' name='talentPool' value='0' />
      </label>

      <input type='hidden' name='skill' value='grit' />

    </div>
  </div>
</form>`

const roller = new Dialog({
  title: "Shiver Roller",
  content: html_content,
  buttons: {
    roll: {
      label: "Roll",
      callback: (html) => {
        const formData = new FormDataExtended(html[0].querySelector('form'));
        const skillDice = (formData.object["skillPool"]);
        const talentDice = (formData.object["talentPool"]);
        const skill = (formData.object["skill"]);      
        const dicePool = skillDice+'d6'+'+'+talentDice+'d8';
        rollPool(dicePool,skill, actor);
      },
    },
    close: {
      label: "Close",
      callback: () => {
        }
      }
    },
    render: (html) => {
      updateDialogDefaults(html,skill,skillDice,talentDice);
      html.on('change', updateSkillSelection)
    },
    default: "roll" 
  });



  roller.render(true);
}

let updateSkillSelection = (event) => {
  const targetElement = event.currentTarget;
  const formElement = $(targetElement).find('form');
  const skill = formElement?.find('[name="skill"]');
  const skillSelection = formElement?.find('[name="skillSelection"]');
  // set values
  skill.val(skillSelection.val());
}

let updateDialogDefaults = (html,skill,skilldice,talentdice) => {
  //update values based on player click
  const formElement = $(html).find('form');
  const skillSelection = formElement?.find('[name="skillSelection"]');
  const skillUpdate = formElement?.find('[name="skill"]');
  const skillPool = formElement?.find('[name="skillPool"]');
  const talentPool = formElement?.find('[name="talentPool"]')
  skillSelection.val(skill);
  skillUpdate.val(skill);
  skillPool.val(skilldice);
  talentPool.val(talentdice);
}


/**
 *  Roll the pool of dice
 */
 async function rollPool(pool, skill, actor){
  let roll = await new Roll(pool).evaluate({async: true});

  let skillType = 0;
  switch(skill){
      case 'grit':
          skillType = 1;
          break
      case 'wit':
          skillType = 2;
          break
      case 'smarts':
          skillType = 3;
          break
      case 'heart':
          skillType = 4;
          break
      case 'strange':
          skillType = 5;
          break
      case 'luck':
          skillType = 6;
          break
      default:
          break;
  };


  let successes = 0;
  let strange = 0;
  let luck = 0;
  let d6results = [];
  let d8results = [];

  for(let i = 0; i < roll.dice.length; ++i){
      for(let j = 0; j < roll.dice[i].results.length; ++j){
          //skill dice
          if(i == 0)
          {
              d6results.push(roll.dice[i].results[j].result);
              if( roll.dice[i].results[j].result == skillType) successes += 1; 
              if( roll.dice[i].results[j].result == 5) strange+=1;
              if(roll.dice[i].results[j].result == 6) luck += 1;
          }
          
          //talent dice
          if(i == 1){
              let dieResult = roll.dice[i].results[j].result;
              d8results.push(dieResult);
              switch(dieResult){
                  case 1:
                      strange +=2;
                      if( skillType == 5)
                      successes +=2;
                      break
                  case 2:
                  case 3:
                      strange +=1;
                      if( skillType == 5)
                      successes +=1;
                      break
                  case 4:
                  case 5:
                  case 6:
                      if( skillType != 5)
                      successes +=1;
                      break;
                  case 7:
                  case 8:
                      if( skillType != 5)
                      successes +=2;
                      break;
                  default:
                      break;
              }
          }
          
      }
  }

      
  let dices6 = '';
  let dices8 = '';

  for(let i = 0; i < d6results.length; ++i){
      dices6 += '<i class="fas fa-dice-d6"></i>'+d6results[i]+'  '; 
  }

  for(let i = 0; i < d8results.length; ++i){
      dices8 += '<i class="fas fa-dice-d8"></i>'+d8results[i]+'  '; 
  }

  let printsuccesses = '';
  if(successes > 0){
      printsuccesses = `<h3><span style="color:green">successes: <b>${successes}</b></span></h3>`
  }else{
      printsuccesses = `<h3><span style="color:red">successes: <b>${successes}</b></span></h3>`
  }
  

  let diceHtml = await roll.render();
  let results_html = `<h2>Rolled <b>${skill}</b></h2>
                      ${printsuccesses}
                      <div></div>
                      <h3><span style="color:purple">strange: <b>${strange}</b></span></h3>
                      <div></div>
                      <h3><span style="color:DarkOliveGreen">luck: <b>${luck}</b></span></h3>
                      <div></div>
                      <a class="inline-result">
                      <span>${diceHtml}</span>
                      <div></div>
                      <span>${dices6}</span>
                      <span>${dices8}</span>`

  ChatMessage.create({
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    rolls: [roll],
    rollMode: game.settings.get("core", "rollMode", "roll", ),
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({actor: actor}),
    content: results_html
  });
}
