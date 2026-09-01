import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commands=[
new SlashCommandBuilder().setName("ping").setDescription("Check VELVET"),
new SlashCommandBuilder().setName("vp").setDescription("Show your VP"),
new SlashCommandBuilder().setName("inventory").setDescription("Show your inventory"),
new SlashCommandBuilder().setName("collection").setDescription("Show your collection"),
new SlashCommandBuilder().setName("leaderboard").setDescription("Top players"),
new SlashCommandBuilder().setName("play").setDescription("Play VELVET").addSubcommand(s=>s.setName("card").setDescription("Enter the Deck").addIntegerOption(o=>o.setName("entry").setDescription("VP entry").setRequired(true).setMinValue(1))),
new SlashCommandBuilder().setName("daily").setDescription("Claim daily reward"),
new SlashCommandBuilder().setName("recovery").setDescription("Claim recovery reward"),
new SlashCommandBuilder().setName("admin").setDescription("Owner admin management").addSubcommand(s=>s.setName("add").setDescription("Add admin").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true))).addSubcommand(s=>s.setName("remove").setDescription("Remove admin").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true))).addSubcommand(s=>s.setName("list").setDescription("List admins")).addSubcommand(s=>s.setName("permissions").setDescription("Set permissions").addUserOption(o=>o.setName("user").setDescription("User").setRequired(true)).addStringOption(o=>o.setName("permissions").setDescription("Comma-separated permissions").setRequired(true))),
new SlashCommandBuilder().setName("song").setDescription("Music library").addSubcommand(s=>s.setName("add").setDescription("Add local audio").addAttachmentOption(o=>o.setName("file").setDescription("Audio file").setRequired(true)).addStringOption(o=>o.setName("name").setDescription("Track name").setRequired(true))).addSubcommand(s=>s.setName("remove").setDescription("Remove track").addIntegerOption(o=>o.setName("id").setDescription("Track ID").setRequired(true).setMinValue(1))).addSubcommand(s=>s.setName("play").setDescription("Play track").addStringOption(o=>o.setName("name").setDescription("Track name").setRequired(true))).addSubcommand(s=>s.setName("stop").setDescription("Stop music")),
new SlashCommandBuilder().setName("songs").setDescription("List music"),
new SlashCommandBuilder().setName("join").setDescription("Join your voice channel"),
new SlashCommandBuilder().setName("leave").setDescription("Leave voice channel"),
new SlashCommandBuilder().setName("connect").setDescription("Connect account"),
new SlashCommandBuilder().setName("disconnect").setDescription("Disconnect account"),
new SlashCommandBuilder().setName("avatar").setDescription("Show avatar").addUserOption(o=>o.setName("user").setDescription("User")),
new SlashCommandBuilder().setName("banner").setDescription("Show banner").addUserOption(o=>o.setName("user").setDescription("User")),
new SlashCommandBuilder().setName("profile").setDescription("Show profile").addUserOption(o=>o.setName("user").setDescription("User")),
new SlashCommandBuilder().setName("add").setDescription("Content management"),
new SlashCommandBuilder().setName("edit").setDescription("Content management"),
new SlashCommandBuilder().setName("remove").setDescription("Content management"),
new SlashCommandBuilder().setName("list").setDescription("Content management")
];
