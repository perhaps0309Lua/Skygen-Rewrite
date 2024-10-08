import { ActionFormData } from "@minecraft/server-ui";
import { MinecraftColors, MinecraftFormatCodes } from "../chatFormat";
import { Player, world } from "@minecraft/server";
import { adminActions, openBaseMenu } from "./adminActions/moderationActions";
import { getHighestRank, isAdmin } from "../data/player/ranks";

const playersWithMenuOpened: string[] = [];
export function handleAdminMenu(player: Player) {
    if (playersWithMenuOpened.includes(player.name)) return;

    if (!isAdmin(player)) return;
    const form = new ActionFormData()
        .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `Admin Menu`)
        .body("§eSelect an action to take.\n");

    const mappedActions: string[] = []
    for (const actionName in adminActions) {
        const actionData = adminActions[actionName];
        mappedActions.push(actionName);

        if (actionData.icon) {
            form.button(actionName, actionData.icon);
        } else {
            form.button(actionName);
        }
    }

    // @ts-ignore
    form.show(player).then((response) => {
        playersWithMenuOpened.splice(playersWithMenuOpened.indexOf(player.name), 1);
        if (response.canceled) return;
        if (response.selection === undefined) return;

        openBaseMenu(player, mappedActions[response.selection]);
    });
    playersWithMenuOpened.push(player.name);
}