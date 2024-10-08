import { world, PlayerJoinAfterEvent, Player, PlayerSpawnAfterEvent, ItemStack, EntityItemComponent, EntityInventoryComponent, ItemLockMode, ItemComponentTypes, EnchantmentType } from "@minecraft/server";
import { MinecraftColors, MinecraftFormatCodes } from "../../libraries/chatFormat";
import { getHighestRank } from "../../libraries/data/player/ranks";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import { getPlayerData } from "../../libraries/data/player/playerData";

// Register default player data
const defaultData = {
    dropMultiplier: 1,
    xpMultiplier: 1,
    effects: {}, // haste = {effect: string, duration: number, strength: number, title: string, startTime: number}
    hasJoinedBefore: false
};

export function handlePlayerJoin(event: PlayerSpawnAfterEvent) {
    const player = event.player;
    const playerName = player.name;
    const playerData = getPlayerData(playerName);
    const { highestPriority } = getHighestRank(player);

    if (!playerData.getHasJoined()) {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen >> " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server for the first time!\n");
        playerData.setHasJoined(true);
    } else {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen >> " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server again!\n");
    }

    const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
    const inventoryContainer = playerInventory.container;
    if (!inventoryContainer) return;

    const compass = new ItemStack("minecraft:compass", 1);
    compass.nameTag = MinecraftFormatCodes.BOLD + MinecraftColors.GREEN + "Bouncy" + MinecraftColors.AQUA + "MC";
    compass.lockMode = ItemLockMode.slot;
    inventoryContainer.setItem(8, compass);

    if (highestPriority > 0) {
        const stick = new ItemStack("minecraft:stick", 1);
        stick.nameTag = MinecraftFormatCodes.BOLD + MinecraftColors.RED + "Admin Stick";
        stick.lockMode = ItemLockMode.slot;
        inventoryContainer.setItem(7, stick);
    }
}