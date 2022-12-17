import moment from "moment";
import winston from "winston";
import Transport from "winston-transport";

const Colors: any = {
    debug: "\x1b[36m",
    info: "\x1b[36m",
    error: "\x1b[31m",
    warn: "\x1b[33m",
    verbose: "\x1b[43m",
};

export class SimpleConsoleTransport extends Transport {
    constructor() {
        super();
    }
    log = (info: { level: any; message: any; stack: any; }, callback: () => void) => {
        const { level, message, stack } = info;
        var timestamp = moment().toDate().toLocaleString();
        console.log(
            `${Colors[level]}${timestamp}\t${level}\t${message}\x1b[0m`,
            stack ? "\n" + stack : ""
        )
        if (callback) {
            callback();
        }
    };
}