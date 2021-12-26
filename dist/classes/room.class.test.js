"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const teams_enum_1 = require("../enums/teams.enum");
const room_class_1 = __importDefault(require("./room.class"));
describe("Room", () => {
    let room;
    beforeEach(() => (room = new room_class_1.default("Test")));
    it("Creates the correct number of cards", () => {
        expect(room.cards.length).toBe(25);
    });
    it("Assigns one card as an assassin", () => {
        const assassin = room.cards.filter((card) => card.isAssassin);
        expect(assassin).toHaveLength(1);
    });
    it("Assigns correct number of cards to teams", () => {
        const startingTeamCards = room.cards.filter((card) => card.team === room.activeTeam);
        const otherTeamCards = room.cards.filter((card) => card.team && card.team !== room.activeTeam);
        expect(startingTeamCards).toHaveLength(9);
        expect(otherTeamCards).toHaveLength(8);
    });
    it("Reveal method sets card to revealed", () => {
        room.revealCard(room.cards[0]);
        expect(room.cards[0]).toHaveProperty("isRevealed", true);
    });
    it("Correctly counts remaining hidden cards", () => {
        const blueCards = room.cards.filter((card) => card.team === teams_enum_1.Teams.BLUE);
        const count = blueCards.length;
        room.revealCard(blueCards[0]);
        const remaining = room.countRemainingCards(teams_enum_1.Teams.BLUE);
        expect(remaining).toBe(count - 1);
    });
    it("Identifies a win when assassin is revealed", () => {
        const assassin = room.cards.find((card) => card.isAssassin);
        room.revealCard(assassin);
        expect(room.checkForWin()).toBe(true);
    });
    it("Identifies a win when all teams cards are revealed", () => {
        const blueCards = room.cards.filter((card) => card.team === teams_enum_1.Teams.BLUE);
        blueCards.forEach((card) => room.revealCard(card));
        expect(room.checkForWin()).toBe(true);
    });
});
//# sourceMappingURL=room.class.test.js.map