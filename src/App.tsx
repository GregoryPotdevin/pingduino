/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="web-bluetooth" />

import { AppBar, Box, Button, ButtonGroup, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { useSetState } from 'react-use';
import './App.css';
import LabeledSlider from './components/LabeledSlider';
import { pingduino } from './data/pinguino';
import { useWriteValue } from './hooks/useWriteValue';

const motorSliderProps = {
  valueLabelDisplay: 'auto',
  marks: true,
  min: 0,
  step: 2,
  max: 50,
} as const;

const turnSpeeds = [
  { value: 0, label: '😴' },
  { value: -6, label: '🙂' },
  { value: -8, label: '😊' },
  { value: -10, label: '😃' },
  { value: -12, label: '🤪' },
  { value: -14, label: '🤣' },
];

enum Mode {
  FIXED = 0,
  ALTERNATE = 1,
  ALTERNATE_CENTER = 2,
}

const modes = [
  { value: Mode.FIXED, label: 'Fixed' },
  { value: Mode.ALTERNATE, label: 'Alternate' },
  { value: Mode.ALTERNATE_CENTER, label: 'Alternate center' },
];

type CharacteristicState = {
  upperMotor?: BluetoothRemoteGATTCharacteristic | null;
  lowerMotor?: BluetoothRemoteGATTCharacteristic | null;
  turnerMotor?: BluetoothRemoteGATTCharacteristic | null;
  direction?: BluetoothRemoteGATTCharacteristic | null;
  mode?: BluetoothRemoteGATTCharacteristic | null;
};

function App() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  const [characteristics, setCharacteristics] = useSetState<CharacteristicState>({});
  const [speeds, setSpeeds] = useSetState({
    upperMotor: 0,
    lowerMotor: 0,
    turnerMotor: 0,
    direction: 90,
    mode: Mode.FIXED,
  });

  const throttledWriteValue = useWriteValue(characteristics);

  const onDisconnect = () => {
    alert('Disconnected');
    setDevice(null);
    setCharacteristics({ lowerMotor: null, upperMotor: null, turnerMotor: null });
    setSpeeds({ upperMotor: 0, lowerMotor: 0, turnerMotor: 0 });
  };

  const onConnectedDevice = async (newDevice: BluetoothDevice) => {
    console.log('connect to', newDevice.name);
    setDevice(newDevice);

    newDevice.addEventListener('gattserverdisconnected', onDisconnect);

    const server = await newDevice.gatt?.connect();
    if (!server) {
      return onDisconnect();
    }

    const service = await server.getPrimaryService(pingduino.serviceId);
    console.log('service', service);

    const characteristics = {
      upperMotor: await service.getCharacteristic(pingduino.characteristicIds.upperMotor),
      lowerMotor: await service.getCharacteristic(pingduino.characteristicIds.lowerMotor),
      turnerMotor: await service.getCharacteristic(pingduino.characteristicIds.turnerMotor),
      direction: await service.getCharacteristic(pingduino.characteristicIds.direction),
      mode: await service.getCharacteristic(pingduino.characteristicIds.mode),
    };
    setCharacteristics(characteristics);
    setSpeeds({
      upperMotor: (await characteristics.upperMotor?.readValue())?.getUint8(0) ?? 0,
      lowerMotor: (await characteristics.lowerMotor?.readValue())?.getUint8(0) ?? 0,
      turnerMotor: (await characteristics.turnerMotor?.readValue())?.getInt8(0) ?? 0,
      direction: (await characteristics.direction?.readValue())?.getInt8(0) ?? 0,
      mode: (await characteristics.mode?.readValue())?.getUint8(0) ?? Mode.FIXED,
    });
  };

  const handleConnect = () => {
    navigator.bluetooth
      .requestDevice({
        //acceptAllDevices: true,
        filters: [
          {
            services: [pingduino.serviceId],
            //name: "Pingduino"
          },
        ],
        optionalServices: [pingduino.serviceId],
      })
      .then(onConnectedDevice)
      .catch((error) => {
        console.error('error', error.name, error.message, error.stack);
      });
  };

  const handleDisconnect = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
  };

  const handleUint8Value = (type: keyof CharacteristicState, value: number) => {
    setSpeeds({ [type]: value });
    throttledWriteValue(type, new Uint8Array([value]));
  };

  const handleInt8Value = (type: keyof CharacteristicState, value: number) => {
    setSpeeds({ [type]: value });
    throttledWriteValue(type, new Int8Array([value]));
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} style={{ lineHeight: 'normal' }}>
            <div>Pingduino</div>
            {device && <div style={{ fontSize: 'small' }}>Connected to {device.name}</div>}
          </Typography>
          {device && (
            <Button color="inherit" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box style={{ flex: 1, position: 'relative' }}>
        {!device && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Button variant="contained" onClick={handleConnect}>
              Connect
            </Button>
          </div>
        )}

        {characteristics.upperMotor && (
          <div className="PingduinoControl">
            <LabeledSlider
              {...motorSliderProps}
              label="Upper motor speed"
              value={speeds.upperMotor}
              onChange={(_e, v) => handleUint8Value('upperMotor', v as number)}
            />
            <ButtonGroup variant="contained">
              <Button onClick={() => handleUint8Value('upperMotor', 0)}>MIN</Button>
              <Button onClick={() => handleUint8Value('upperMotor', 180)}>MAX</Button>
            </ButtonGroup>
          </div>
        )}
        {characteristics.lowerMotor && (
          <div className="PingduinoControl">
            <LabeledSlider
              {...motorSliderProps}
              label="Lower motor speed"
              value={speeds.lowerMotor}
              onChange={(_e, v) => handleUint8Value('lowerMotor', v as number)}
            />
            <ButtonGroup variant="contained">
              <Button onClick={() => handleUint8Value('lowerMotor', 0)}>MIN</Button>
              <Button onClick={() => handleUint8Value('lowerMotor', 180)}>MAX</Button>
            </ButtonGroup>
          </div>
        )}
        {characteristics.turnerMotor && (
          <div className="PingduinoControl">
            <Typography>Ball frequency</Typography>
            <ToggleButtonGroup
              color="primary"
              value={speeds.turnerMotor}
              exclusive
              onChange={(_e, v) => handleInt8Value('turnerMotor', v as number)}
              aria-label="Platform"
            >
              {turnSpeeds.map(({ value, label }) => (
                <ToggleButton key={value} value={value}>
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        )}
        {characteristics.direction && (
          <div className="PingduinoControl">
            <LabeledSlider
              label="Direction"
              value={speeds.direction}
              valueLabelDisplay="auto"
              marks
              min={-60}
              step={5}
              max={60}
              onChange={(_e, v) => handleInt8Value('direction', v as number)}
            />
          </div>
        )}
        {characteristics.mode && (
          <div className="PingduinoControl">
            <Typography>Mode</Typography>
            <ToggleButtonGroup
              color="primary"
              value={speeds.mode}
              exclusive
              onChange={(_e, v) => handleInt8Value('mode', v as number)}
              aria-label="Platform"
            >
              {modes.map(({ value, label }) => (
                <ToggleButton key={value} value={value}>
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        )}
      </Box>
    </Box>
  );
}

export default App;
