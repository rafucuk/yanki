export class Privatechannel1703374362717 {
    name = 'Privatechannel1703374362717'

    async up(queryRunner) {
            await queryRunner.query(`ALTER TABLE "channel" ADD "isPrivate" boolean`);
    }

    async down(queryRunner) {
           await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isPrivate"`);
    }
}
