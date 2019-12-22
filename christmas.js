const Wemo = require('wemo-client');
const HueBridgeEmulator = require('hue-bridge-emulator');

const wemo = new Wemo();

const readyHueEmulator = client => {
    const hueBridgeEmulator = new HueBridgeEmulator();
    hueBridgeEmulator.start();
    //hueBridgeEmulator.addLight('CueMusic', (key, value) => console.log(`foo.${key} => ${value}`));
    //hueBridgeEmulator.addLight('bar');

    let songProcess;
    let songPlaying = false;

    let musicIndex = 1;
    hueBridgeEmulator.addLight('CueMusic', (key, value) => {
        console.log("Trigger CueMusic " + musicIndex);
        if (key === "on") {
            if (songPlaying) {
                songProcess.kill('SIGINT');
                client.setBinaryState(0);
                songPlaying = false;
            } else {
                let hoHoHo = require('child_process').exec('afplay hohoho.wav');
                hoHoHo.on('exit', () => {
                    client.getBinaryState((err, state) => {
                        if (err) console.error(err);
                        console.log(`Got State: ${state}`);
                        let setState = Math.abs(state - 1);
                        console.log(`Setting state to ${setState}`);
                        client.setBinaryState(setState, () => {
                            if (typeof songProcess === "undefined" || songPlaying === false) {
                                songPlaying = true;
                                //songProcess = await spawn('afplay', ['mariahcarey.wav']);
                                songProcess = require('child_process').exec('afplay mariahcarey.wav');

                                songProcess.on('exit', () => client.setBinaryState(0));
                            } else {
                                songProcess.kill('SIGINT');
                                songPlaying = false;
                            }
                            musicIndex++;
                        });
                    });
                });
            }
        }
    });

    // let lightIndex = 1;
    // hueBridgeEmulator.addLight('CueLights', (key, value) => {
    //     console.log("Trigger CueLights " + lightIndex);
    //     client.getBinaryState(state => client.setBinaryState(Math.abs(state - 1)));
    //     lightIndex++;
    // });
};

// readyHueEmulator(null);

let firstBinaryState = true;

wemo.discover((err, deviceInfo) => {
    console.log("Connected to Wemo device with deviceInfo" + deviceInfo);

    let client = wemo.client(deviceInfo);

    client.on('error', err => console.error(err));

    client.on('binaryState', value => {
        console.log(`binaryState ${value}`);
        if (firstBinaryState) {
            readyHueEmulator(client);
            firstBinaryState = false;
        }
    });

    client.setBinaryState(0);
});
