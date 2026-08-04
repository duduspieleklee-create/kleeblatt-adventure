import type { Hero, HeroClass } from "@kleeblatt/shared";

const BASE_STATS: Record<HeroClass, { maxHp: number; maxResource: number }> = {
  melee: { maxHp: 120, maxResource: 100 },
  ranged: { maxHp: 90, maxResource: 100 },
  mage: { maxHp: 80, maxResource: 100 },
};

const HP_PER_LEVEL = 12;

export function getMaxHp(hero: Hero): number {
  const base = BASE_STATS[hero.class]?.maxHp ?? 120;
  return base + (hero.level - 1) * HP_PER_LEVEL;
}

export function getMaxResource(hero: Hero): number {
  return BASE_STATS[hero.class]?.maxResource ?? 100;
}

export function getResourceType(hero: Hero): "mana" | "stamina" {
  return hero.class === "mage" ? "mana" : "stamina";
}

export function getClassExpression(heroClass: HeroClass): string {
  const map: Record<HeroClass, string> = {
    melee: "/assets/ui/expression_attack.png",
    ranged: "/assets/ui/expression_alerted.png",
    mage: "/assets/ui/expression_chat.png",
  };
  return map[heroClass];
}

export function getSlotIcon(slot: string | null | undefined): string {
  const map: Record<string, string> = {
    weapon: "/assets/ui/sword.png",
    chest: "/assets/ui/itemdisc_01.png",
    head: "/assets/ui/itemdisc_02.png",
    legs: "/assets/ui/itemdisc_01.png",
    accessory: "/assets/ui/indicator.png",
  };
  return map[slot ?? ""] ?? "/assets/ui/itemdisc_01.png";
}

export function getToolIcon(templateId: string): string {
  const map: Record<string, string> = {
    tool_sword: "/assets/ui/sword.png",
    tool_axe: "/assets/ui/axe.png",
    tool_hammer: "/assets/ui/hammer.png",
    tool_pickaxe: "/assets/ui/pickaxe.png",
    tool_rod: "/assets/ui/rod.png",
    tool_shovel: "/assets/ui/shovel.png",
    tool_water: "/assets/ui/water.png",
    tool_basket: "/assets/ui/basket.png",
    tool_stopwatch: "/assets/ui/stopwatch.png",
    tool_sandtimer: "/assets/ui/sandtimer.png",
  };
  return map[templateId] ?? "/assets/ui/itemdisc_01.png";
}

export const CLASS_EXPRESSION_MAP: Record<HeroClass, string> = {
  melee: "/assets/ui/expression_attack.png",
  ranged: "/assets/ui/expression_alerted.png",
  mage: "/assets/ui/expression_chat.png",
};
