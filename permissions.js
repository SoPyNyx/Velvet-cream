import { config } from "../config.js";
import { getAdminPermissions, isAdmin } from "../database/repository.js";

export const PERMISSIONS=["VP_MANAGEMENT","APPEARANCE_MANAGEMENT","MUSIC_MANAGEMENT","MUSIC_PLAYBACK","CARD_MANAGEMENT","COLLECTIBLE_MANAGEMENT"];
export async function can(userId,permission) {
  if(userId===config.ownerId) return true;
  if(!(await isAdmin(userId))) return false;
  return (await getAdminPermissions(userId)).includes(permission);
}
export function ownerOnly(userId){return userId===config.ownerId;}
