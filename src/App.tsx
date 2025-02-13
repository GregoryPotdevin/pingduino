/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="web-bluetooth" />

import { AppBar, Box, Button, ButtonGroup, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import './App.css';
import LabeledSlider from './components/LabeledSlider';
import { pingduino } from './data/pinguino';
import { useSetState } from 'react-use';
import { throttle } from 'lodash';
import { useWriteValue } from './hooks/useWriteValue';

const motorSliderProps = {
  valueLabelDisplay: 'auto',
  marks: true,
  min: 0,
  step: 2,
  max: 50,
} as const;

const turnSpeeds = [
  { value: 0, label: 'Stop' },
  { value: -6, label: 'Slow' },
  { value: -9, label: 'Normal' },
  { value: -12, label: 'Fast' },
  { value: -16, label: 'Very fast' },
];

type CharacteristicState = {
  upperMotor?: BluetoothRemoteGATTCharacteristic | null;
  lowerMotor?: BluetoothRemoteGATTCharacteristic | null;
  turnerMotor?: BluetoothRemoteGATTCharacteristic | null;
};

function App() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  const [characteristics, setCharacteristics] = useSetState<CharacteristicState>({});
  const [speeds, setSpeeds] = useSetState<{ upperMotor: number; lowerMotor: number; turnerMotor: number }>({
    upperMotor: 0,
    lowerMotor: 0,
    turnerMotor: 0,
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
    };
    setCharacteristics(characteristics);
    setSpeeds({
      upperMotor: (await characteristics.upperMotor?.readValue())?.getUint8(0) ?? 0,
      lowerMotor: (await characteristics.lowerMotor?.readValue())?.getUint8(0) ?? 0,
      turnerMotor: (await characteristics.turnerMotor?.readValue())?.getInt8(0) ?? 0,
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

  const handleMotorSpeed = (type: keyof CharacteristicState, value: number) => {
    setSpeeds({ [type]: value });
    throttledWriteValue(type, new Uint8Array([value]));
  };

  const handleTurnerSpeed = (type: keyof CharacteristicState, value: number) => {
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
          <div style={{ padding: 32 }}>
            <LabeledSlider
              {...motorSliderProps}
              label="Upper motor speed"
              value={speeds.upperMotor}
              onChange={(_e, v) => handleMotorSpeed('upperMotor', v as number)}
            />
            <ButtonGroup variant="contained">
              <Button onClick={() => handleMotorSpeed('upperMotor', 0)}>MIN</Button>
              <Button onClick={() => handleMotorSpeed('upperMotor', 180)}>MAX</Button>
            </ButtonGroup>
          </div>
        )}
        {characteristics.lowerMotor && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              {...motorSliderProps}
              label="Lower motor speed"
              value={speeds.lowerMotor}
              onChange={(_e, v) => handleMotorSpeed('lowerMotor', v as number)}
            />
            <ButtonGroup variant="contained">
              <Button onClick={() => handleMotorSpeed('lowerMotor', 0)}>MIN</Button>
              <Button onClick={() => handleMotorSpeed('lowerMotor', 180)}>MAX</Button>
            </ButtonGroup>
          </div>
        )}
        {characteristics.turnerMotor && (
          <div style={{ padding: 32 }}>
            <Typography>Ball frequency</Typography>
            <ToggleButtonGroup
              color="primary"
              value={speeds.turnerMotor}
              exclusive
              onChange={(_e, v) => handleTurnerSpeed('turnerMotor', v as number)}
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
        {/* {characteristics.turnerMotor && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              label="Turning speed"
              value={speeds.turnerMotor}
              valueLabelDisplay="auto"
              marks
              min={-20}
              step={1}
              max={20}
              onChange={(_e, v) => handleTurnerSpeed('turnerMotor', v as number)}
            />
          </div>
        )} */}
        {/* {pushAngleCharacteristic && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              label="Push angle"
              value={pushAngle}
              valueLabelDisplay="auto"
              marks
              min={0}
              step={5}
              max={180}
              onChange={(_e, v) => handlePushAngle(v as number)}
            />
          </div>
        )} */}
      </Box>
    </Box>
  );
}

export default App;
