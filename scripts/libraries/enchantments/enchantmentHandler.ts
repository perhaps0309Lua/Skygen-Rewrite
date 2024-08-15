import { EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { addCustomEnchantment, ItemDataHandler, updateLore } from "../data/item/itemData";
import { ActionFormData } from "@minecraft/server-ui";

import { fortuneData } from "./fortune";
import { luck1Data } from "./luck1";
import { luck2Data } from "./luck2";
import { xpboostData } from "./xpboost";
import { EnchantmentPurchaseT } from "../../types";
import { abbreviateMoney, getPlayerMoney, setPlayerMoney } from "../data/player/money";
import { chatError, chatSuccess, MinecraftColors } from "../chatFormat";

const enchantments: { [key: string]: EnchantmentPurchaseT } = {
    "fortune": fortuneData,
    "luck1": luck1Data,
    "luck2": luck2Data,
    "xpboost": xpboostData,
};

// Function to get the player's enchantment level
export function getEnchantmentLevel(player: Player, enchantment: string, playerItem: ItemStack): number {
    const enchantmentData = (ItemDataHandler.get("enchantments", playerItem) as any) || {};
    return enchantmentData[enchantment]?.level || 0;
}

// Function to set the player's enchantment level
export function setEnchantmentLevel(player: Player, enchantment: string, level: number, playerItem: ItemStack): void {
    const enchantmentData = (ItemDataHandler.get("enchantments", playerItem) as any) || {};

    enchantmentData[enchantment].level = level;
    ItemDataHandler.set("enchantments", enchantmentData, playerItem, player);
}

let specialTypes: { [key: string]: MinecraftColors } = {
    "wooden": MinecraftColors.GREEN,
    "stone": MinecraftColors.GRAY,
    "iron": MinecraftColors.WHITE,
    "gold": MinecraftColors.GOLD,
    "diamond": MinecraftColors.AQUA,
    "netherite": MinecraftColors.DARK_RED,
    "leather": MinecraftColors.GRAY,
    "chainmail": MinecraftColors.WHITE,
}

export function handleEnchantmentMenu(player: Player, playerItem: ItemStack): void {
    let itemType = playerItem.typeId
    let itemMaterial = itemType.split(":")[1].split("_")[0]
    let itemColor = specialTypes[itemMaterial] || MinecraftColors.WHITE
    const form = new ActionFormData()
        .title(`§5§lEnchantment Menu - §r${itemColor}${playerItem.nameTag || playerItem.typeId.replace("minecraft:", "").split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`)
        .body("§eSelect an §5§lenchantment §r§eto §eupgrade\n");

    for (const enchantment in enchantments) {
        let enchantmentData = enchantments[enchantment];
        const currentLevel = getEnchantmentLevel(player, enchantmentData.name, playerItem);
        const baseCost = enchantmentData.baseCost;
        const costIncrease = enchantmentData.costIncrease;
        const enchantmentCost = baseCost + (currentLevel * costIncrease);
        form.button(enchantmentData.title + " - " + abbreviateMoney(enchantmentCost));
    }

    // @ts-ignore
    form.show(player).then(response => {
        if (response.canceled) return;
        if (!response.selection && response.selection !== 0) return;

        const selectedEnchantment = Object.keys(enchantments)[response.selection];
        const currentLevel = getEnchantmentLevel(player, selectedEnchantment, playerItem);
        let playerMoney = getPlayerMoney(player);

        let enchantmentData = enchantments[selectedEnchantment];
        let enchantmentTitle = enchantmentData.title;

        const effectTitle = enchantmentData.effectTitle;
        const effectAmount = enchantmentData.effectAmount;
        const effectSymbol = enchantmentData.effectSymbol; // "-" or "+"

        // Calculate the cost of the enchantment
        const baseCost = enchantmentData.baseCost;
        const costIncrease = enchantmentData.costIncrease;
        const enchantmentCosts = baseCost + (currentLevel * costIncrease);

        let enchantmentBody = [
            `§r§6${enchantmentData.description}\n\n`,
            `§eCurrent Level: §r§e${currentLevel} - ${effectSymbol}${effectAmount * currentLevel}${effectTitle}\n`,
            `§eNext Level: §r§e${currentLevel + 1} - ${effectSymbol}${effectAmount * (currentLevel + 1)}${effectTitle}\n`,
            `§eCost: §r§e${abbreviateMoney(enchantmentCosts)}`
        ]

        const modalForm = new ActionFormData()
            .title(`${enchantmentTitle} - §a[${abbreviateMoney(playerMoney)} Money]`)
            .body(enchantmentBody.join(""))

        modalForm.button("§2§lUpgrade Level +1");
        modalForm.button("§8§lGo Back");

        // @ts-ignore
        modalForm.show(player).then(modalResponse => {
            if (modalResponse.canceled) return;
            const buttonResponse = modalResponse.selection;

            if (buttonResponse === 1) {
                openEnchantmentMenu(player);
                return;
            }

            const playerMoney = getPlayerMoney(player);
            if (playerMoney >= enchantmentCosts) {
                setPlayerMoney(player, playerMoney - enchantmentCosts);

                if (currentLevel === 0) {
                    addCustomEnchantment(player, playerItem, {
                        name: selectedEnchantment,
                        currentDisplayName: enchantmentData.title,
                        level: 1,
                    });
                } else {
                    setEnchantmentLevel(player, selectedEnchantment, currentLevel + 1, playerItem);
                }

                chatSuccess(player, `${enchantmentData.title} §r§aincreased to level §l${currentLevel + 1}!`);
                updateLore(player, playerItem);
            } else {
                chatError(player, "You do not have enough money to purchase this enchantment.");
            }
        });
    });
}

// Function to open the enchantment menu
export function openEnchantmentMenu(player: Player): void {
    // Check if the player has a tool equipped, if not prompt to select a tool
    const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
    let playerItem: ItemStack = playerEquipment.getEquipment(EquipmentSlot.Mainhand)!;
    if (!playerItem) {
        const storedItems: ItemStack[] = [];
        const form = new ActionFormData()
            .title("Enchantment Menu - No Tool Equipped")
            .body("Please select a tool or armor piece to enchant");

        // Get player's armor and inventory
        const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        if (!playerInventory.container) return;

        let playerHelmet = playerEquipment.getEquipment(EquipmentSlot.Head);
        let playerChestplate = playerEquipment.getEquipment(EquipmentSlot.Chest);
        let playerLeggings = playerEquipment.getEquipment(EquipmentSlot.Legs);
        let playerBoots = playerEquipment.getEquipment(EquipmentSlot.Feet);
        const armorPieces = [playerHelmet, playerChestplate, playerLeggings, playerBoots];
        const armorTypes = ["Helmet", "Chestplate", "Leggings", "Boots"];

        // Add armor pieces to the form
        for (const armorPiece of armorPieces) {
            if (armorPiece) {
                let itemTag = armorPiece.nameTag;
                if (!itemTag) {
                    // Remove the "minecraft:" prefix and capitalize the first letter of each word
                    itemTag = armorPiece.typeId.split(":")[1].split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                    armorPiece.nameTag = itemTag;
                }

                form.button(`§a${armorPiece.nameTag} - ${armorTypes[armorPieces.indexOf(armorPiece)]}`);
                storedItems.push(armorPiece);
            }
        }

        // Search inventory for a tool, looping through each slot
        for (let i = 0; i < playerInventory.container.size; i++) {
            const item = playerInventory.container.getItem(i);
            if (!item) continue;
            if (item.typeId.includes("pick") || item.typeId.includes("axe") || item.typeId.includes("shovel") || item.typeId.includes("hoe") || item.typeId.includes("sword")) {
                let itemTag = item.nameTag;
                if (!itemTag) {
                    // Remove the "minecraft:" prefix and capitalize the first letter of each word
                    itemTag = item.typeId.split(":")[1].split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                    item.nameTag = itemTag;
                }

                form.button(`§a${itemTag} - Slot ${i}`);
                storedItems.push(item);
            }
        }

        // @ts-ignore
        form.show(player).then(response => {
            if (response.canceled) return;
            if (response.selection === undefined) return;

            const selectedSlot = response.selection;
            playerItem = storedItems[selectedSlot];


            handleEnchantmentMenu(player, playerItem);
        });
    } else {
        handleEnchantmentMenu(player, playerItem);
    }
}