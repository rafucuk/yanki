export class BadgeRoles1703431360581 {
    name = 'BadgeRoles1703431360581'

    async up(queryRunner) {
            await queryRunner.query(`ALTER TABLE "user" ADD "badgeRoles" text array`);
    }

    async down(queryRunner) {
           await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "badgeRoles"`);
    }
}
