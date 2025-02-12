/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="web-bluetooth" />

import { AppBar, Box, Button, ButtonGroup, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import './App.css';
import LabeledSlider from './components/LabeledSlider';
import { pingduino } from './data/pinguino';

const motorSliderProps = {
  valueLabelDisplay: 'auto',
  marks: true,
  min: 0,
  step: 2,
  max: 50,
} as const;

function App() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [, setService] = useState<BluetoothRemoteGATTService | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [upperCharacteristic, setUpperCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [lowerCharacteristic, setLowerCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [turnerCharacteristic, setTurnerCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [, setPushAngleCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  console.log('device', JSON.stringify(device));
  const [upperMotorSpeed, setUpperMotorSpeed] = useState(0);
  const [lowerMotorSpeed, setLowerMotorSpeed] = useState(0);
  const [turnerSpeed, setTurnerSpeed] = useState(0);
  // const [, setPushAngle] = useState(0);

  const onDisconnect = () => {
    alert('Disconnected');
    setDevice(null);
    setServer(null);
    setService(null);
    setCharacteristic(null);
    setUpperCharacteristic(null);
    setLowerCharacteristic(null);
    setTurnerCharacteristic(null);
    setPushAngleCharacteristic(null);
  };

  const onConnectedDevice = async (newDevice: BluetoothDevice) => {
    console.log('connect to', newDevice.name);
    setDevice(newDevice);

    newDevice.addEventListener('gattserverdisconnected', onDisconnect);

    const server = await newDevice.gatt?.connect();
    if (!server) {
      return onDisconnect();
    }
    setServer(server);

    const service = await server.getPrimaryService(pingduino.serviceId);
    console.log('service', service);
    setService(service);

    const characteristic = await service.getCharacteristic(pingduino.characteristicIds.score);
    console.log('characteristic', characteristic);
    setCharacteristic(characteristic);

    const upperCharacteristic = await service.getCharacteristic(pingduino.characteristicIds.upperMotor);
    console.log('upperCharacteristic', upperCharacteristic);
    setUpperCharacteristic(upperCharacteristic);

    const lowerCharacteristic = await service.getCharacteristic(pingduino.characteristicIds.lowerMotor);
    console.log('lowerCharacteristic', lowerCharacteristic);
    setLowerCharacteristic(lowerCharacteristic);

    const turnerCharacteristic = await service.getCharacteristic(pingduino.characteristicIds.turnerMotor);
    console.log('turnerCharacteristic', turnerCharacteristic);
    setTurnerCharacteristic(turnerCharacteristic);

    const pushAngleCharacteristic = await service.getCharacteristic(pingduino.characteristicIds.pushAngle);
    console.log('pushAngleCharacteristic', pushAngleCharacteristic);
    setPushAngleCharacteristic(pushAngleCharacteristic);
  };

  const setValue = (value: number) => {
    characteristic?.writeValue(new Uint8Array([value]));
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

  const handleUpperMotorSpeed = (value: number) => {
    console.log('value', value);
    setUpperMotorSpeed(value);
    upperCharacteristic?.writeValue(new Uint8Array([value]));
  };

  const handleLowerMotorSpeed = (value: number) => {
    console.log('value', value);
    setLowerMotorSpeed(value);
    lowerCharacteristic?.writeValue(new Uint8Array([value]));
  };

  const handleTurnerSpeed = (value: number) => {
    console.log('value', value);
    setTurnerSpeed(value);
    turnerCharacteristic?.writeValue(new Int8Array([value]));
  };

  // const handlePushAngle = (value: number) => {
  //   console.log('value', value);
  //   setPushAngle(value);
  //   pushAngleCharacteristic?.writeValue(new Int8Array([value]));
  // };

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

        {characteristic && (
          <div style={{ padding: 32 }}>
            <ButtonGroup variant="contained">
              <Button onClick={() => setValue(0)}>-</Button>
              <Button onClick={() => setValue(1)}>+</Button>
            </ButtonGroup>
          </div>
        )}

        {upperCharacteristic && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              {...motorSliderProps}
              label="Upper motor speed"
              value={upperMotorSpeed}
              onChange={(_e, v) => handleUpperMotorSpeed(v as number)}
            />
            {/* <ButtonGroup variant="contained">
              <Button onClick={() => handleUpperMotorSpeed(0)}>MIN</Button>
              <Button onClick={() => handleUpperMotorSpeed(180)}>MAX</Button>
            </ButtonGroup> */}
          </div>
        )}
        {lowerCharacteristic && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              {...motorSliderProps}
              label="Lower motor speed"
              value={lowerMotorSpeed}
              onChange={(_e, v) => handleLowerMotorSpeed(v as number)}
            />
            {/* <ButtonGroup variant="contained">
              <Button onClick={() => handleLowerMotorSpeed(0)}>MIN</Button>
              <Button onClick={() => handleLowerMotorSpeed(180)}>MAX</Button>
            </ButtonGroup> */}
          </div>
        )}
        {turnerCharacteristic && (
          <div style={{ padding: 32 }}>
            <LabeledSlider
              label="Turning speed"
              value={turnerSpeed}
              valueLabelDisplay="auto"
              marks
              min={-100}
              step={5}
              max={100}
              onChange={(_e, v) => handleTurnerSpeed(v as number)}
            />
            {/* <ButtonGroup variant="contained">
              <Button onClick={() => handleLowerMotorSpeed(0)}>MIN</Button>
              <Button onClick={() => handleLowerMotorSpeed(180)}>MAX</Button>
            </ButtonGroup> */}
          </div>
        )}
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
