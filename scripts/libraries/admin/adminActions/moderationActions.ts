import { EntityInventoryComponent, Player, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { MinecraftFormatCodes, MinecraftColors, chatSuccess } from "../../chatFormat";
import { isAdmin } from "../../data/player/ranks";
import { ChestFormData, ChestSize } from "../../../util/scripts/functions/forms";
import { getPlayerData } from "../../data/player/playerData";
const potentialLetters = "abcdefghijklmnopqrstuvwxyz123456789"; // Used for chest

// Holds all the functions that admins can perform from their admin stick.
export const adminActions: { [key: string]: any } = {
    "Warn": {
        run: warn,
        description: "§eSelect a user to warn.",
        icon: "textures/icons/warning.png"
    },
    "Kick": {
        run: kick,
        description: "§eSelect a user to kick.",
        icon: "textures/icons/kick.png"
    },
    "Ban": {
        run: ban,
        description: "§eSelect a user to ban.",
        icon: "textures/icons/locked.png"
    },
    "Unban": {
        run: unban,
        description: "§eSelect a user to unban.",
        icon: "textures/icons/unlocked.png",
        dataFilter: {
            filter: { // PlayerDataHandler.get(key, player) === value, if value is a function, it will be run with the player as the argument.
                isBanned: true
            },
            playerSearch: "all", // all, online, offline, function, disabled
            rankFilter: {
                admin: false, // If true, only players with the rank of Admin or higher will be shown. Otherwise, admins will not be shown.
            }
        }
    },
    "Teleport to": {
        run: teleportTo,
        description: "§eSelect a user to teleport to."
    },
    "Teleport here": {
        run: teleportFrom,
        description: "§eSelect a user to teleport to you."
    },
    "Spectate": {
        description: "§eSelect a user to spectate.",
        icon: "textures/icons/spectate.png"
    },
    "Invsee": {
        description: "§eSelect a user to view their inventory.",
        icon: "textures/icons/invsee.png"
    },
}

export function warn(player: Player, targetPlayer: Player) {
    // temp message
    player.sendMessage("Warned.")
    chatSuccess(player, `Gave a warning to ${targetPlayer.name}.`);
}

function kick(player: Player, targetPlayer: Player) {
    world.getDimension("overworld").runCommand(`/kick ${targetPlayer.name}`);
    chatSuccess(player, `Kicked ${targetPlayer.name}.`);
}

function ban(player: Player, targetPlayer: Player) {
    getPlayerData(player.name).setIsBanned(true);
    chatSuccess(player, `Banned ${targetPlayer.name}.`);
}

function unban(player: Player, targetPlayer: Player) {
    getPlayerData(player.name).setIsBanned(false);
    chatSuccess(player, `Unbanned ${targetPlayer.name}.`);
}

function teleportTo(player: Player, targetPlayer: Player) {
    player.teleport(targetPlayer.location);
    chatSuccess(player, `Teleported to ${targetPlayer.name}.`);
}

function invsee(player: Player, targetPlayer: Player) {
    const chestUI = new ChestFormData(ChestSize.SIZE_54)
        .title(`${targetPlayer.name}'s Inventory`);

    // Create a basic layout for an auction house chest UI with glass panes and pages
    chestUI.pattern(
    [
        'xxxxxxxxx',
        'x_______x',
        'x_______x',
        'x_______x',
        'x_______x',
        'axxxxxxxb',
        'axxxxxxxb',
        'axxxxxxxb',
        'axxxxxxxb',
    ],
    {
        x: { itemName: '', itemDesc: [], texture: 'minecraft:stained_glass_pane', stackAmount: 1, enchanted: false },
        a: { itemName: 'Previous Page', itemDesc: [], texture: 'minecraft:arrow', stackAmount: 1, enchanted: false },
        b: { itemName: 'Next Page', itemDesc: [], texture: 'minecraft:arrow', stackAmount: 1, enchanted: false }
    }
    );


    function showUI() {
        chestUI.show(player).then(response => {
            if (response.canceled && response.cancelationReason == FormCancelationReason.UserBusy) {
                system.run(showUI) // Try again next tick
            } else if (response.canceled) {
                player.sendMessage("You closed the chest UI without taking any actions.");
            } else { 
                player.sendMessage("You interacted with the custom chest UI!");
            }
        });
    }

    showUI();
}

function teleportFrom(player: Player, targetPlayer: Player) {
    targetPlayer.teleport(player.location);
    chatSuccess(player, `Teleported ${targetPlayer.name} to ${player.name}.`);
}

export function openBaseMenu(player: Player, commandRan: string) {
    let commandData = adminActions[commandRan];
    const form = new ModalFormData()
        .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `${commandRan} - ${commandData.description || "No description available."}`)

    // dataFilter handling
    if (commandData.dataFilter) {
        let dataFilter = commandData.dataFilter.filter;
        let filter = dataFilter.filter;
        let playerSearch = dataFilter.playerSearch || "all";
        let rankFilter = dataFilter.rankFilter;

        let players: Player[] = [];
        if (playerSearch === "all") { // TODO: impliment offline player search
            players = world.getAllPlayers();
        } else if (playerSearch === "online") {
            players = world.getAllPlayers();
        } else if (playerSearch === "offline") {
            // players = world.getAllPlayers();
        } else if (playerSearch === "function") {
            // players = world.getAllPlayers();
        }
    }


    // @ts-ignore
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.formValues === undefined) return;


    });
}