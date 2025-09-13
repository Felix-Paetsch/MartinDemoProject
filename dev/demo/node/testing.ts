import { Port } from "../../lib/src/messaging/exports";
import MessageChannel from "../../lib/src/middleware/channel/channel";
import { processMessageChannelMessage } from "../../lib/src/middleware/channel/middleware";
import { Failure } from "../../lib/src/messaging/exports";
import chalk from "chalk";

Failure.setAnomalyHandler((e) => {
    throw e;
});
Failure.setErrorHandler((e) => {
    throw e;
});

const WhoToWho: boolean[] = [
    true,
    false,
    false,
    false,
    true,
    true,
    false,
    true,
    false
];

(async () => {
    const p1 = new Port("Test1").open();
    const p2 = new Port("Test2").open();

    MessageChannel.register_processor("test", async (mc) => {
        console.log("Registering processor");

        for (let i = 0; i < WhoToWho.length; i++) {
            const who = WhoToWho[i];
            if (who) {
                console.log(chalk.blue(`Sending MSG ${i}`));
                mc.send(`MSG ${i}`);
            } else {
                console.log(chalk.greenBright(`Awaiting MSG ${i}`));
                console.log(chalk.greenBright(await mc.next()));
            }
        }
    });

    p2.use_middleware(processMessageChannelMessage)
    p1.use_middleware(processMessageChannelMessage)

    {
        const mc = new MessageChannel(
            p2.address, p1,
            { target_processor: "test" },
            { defaultMessageTimeout: 60000 }
        );

        for (let i = 0; i < WhoToWho.length; i++) {
            const who = WhoToWho[i];
            if (!who) {
                console.log(chalk.green(`Sending MSG ${i}`));
                mc.send(`MSG ${i}`);
            } else {
                console.log(chalk.blueBright(`Awaiting MSG ${i}`));
                console.log(chalk.blueBright(await mc.next()));
            }
        }
    }
})();