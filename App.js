import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal,StatusBar } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [topTime, setTopTime] = useState(300); // Varsayılan başlangıç süresi 5 dakika
  const [bottomTime, setBottomTime] = useState(300);
  const [activeClock, setActiveClock] = useState(null);
  const [initialTime, setInitialTime] = useState(5); // Dakika cinsinden başlangıç süresi
  const [increment, setIncrement] = useState(0); // Saniye cinsinden hamle sonrası ek süre
  const [modalVisible, setModalVisible] = useState(false);

  const getBackgroundColor = (clock) => {
    if (clock === 'top') {
      if (topTime === 0) return '#6a040f'; // Süresi biten oyuncu için kırmızı
      return activeClock === 'top' ? '#FFD460' : '#8E9AAF';
    } else {
      if (bottomTime === 0) return '#6a040f'; // Süresi biten oyuncu için kırmızı
      return activeClock === 'bottom' ? '#FFD460' : '#8E9AAF';
    }
  };

  useEffect(() => {
    let timer;
    if (activeClock === 'top' && topTime > 0) {
      timer = setInterval(() => {
        setTopTime((prev) => prev - 1);
      }, 1000);
    } else if (activeClock === 'bottom' && bottomTime > 0) {
      timer = setInterval(() => {
        setBottomTime((prev) => prev - 1);
      }, 1000);
    }

    if (topTime === 0 || bottomTime === 0) {
      clearInterval(timer);
      Alert.alert('Oyun Bitti', `${activeClock === 'top' ? 'Alt' : 'Üst'} oyuncunun süresi doldu. Oyun sona erdi.`);
      setActiveClock(null);
    }

    return () => clearInterval(timer);
  }, [activeClock, topTime, bottomTime]);

  const handlePress = (clock) => {
    if (topTime > 0 && bottomTime > 0) {
      setActiveClock(clock === 'top' ? 'bottom' : 'top');
      if (clock === 'top') {
        setTopTime(prev => prev + increment);
      } else {
        setBottomTime(prev => prev + increment);
      }
    }
  };

  const handlePause = () => {
    setActiveClock(null);
  };

  const handleReset = () => {
    setTopTime(initialTime * 60);
    setBottomTime(initialTime * 60);
    setActiveClock(null);
  };

  const handleSettings = () => {
    setModalVisible(true);
  };

  const handleSaveSettings = () => {
    const validInitialTime = isNaN(initialTime) || initialTime <= 0 ? 5 : initialTime;
    const validIncrement = isNaN(increment) || increment < 0 ? 0 : increment;
    setTopTime(validInitialTime * 60);
    setBottomTime(validInitialTime * 60);
    setModalVisible(false);
    setActiveClock(null);
  };

  const renderInitialTimeOptions = () => {
    const options = [];
    for (let i = 1; i <= 90; i++) {
      options.push(<Picker.Item key={i} label={`${i} dakika`} value={i} />);
    }
    return options;
  };

  const renderIncrementOptions = () => {
    const options = [];
    for (let i = 1; i <= 60; i++) {
      options.push(<Picker.Item key={i} label={`${i} saniye`} value={i} />);
    }
    return options;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TouchableOpacity
        style={[styles.clockContainer, { backgroundColor: getBackgroundColor('top') }]}
        onPress={() => handlePress('top')}
        disabled={activeClock === 'bottom' || topTime === 0 || bottomTime === 0}
      >
        <Text style={styles.clockText}>{formatTime(topTime)}</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
          <Feather name="pause" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Feather name="refresh-cw" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleSettings}>
          <Feather name="settings" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.clockContainer, { backgroundColor: getBackgroundColor('bottom') }]}
        onPress={() => handlePress('bottom')}
        disabled={activeClock === 'top' || topTime === 0 || bottomTime === 0}
      >
        <Text style={styles.clockText}>{formatTime(bottomTime)}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Initial Time (minutes):</Text>
            <Picker
              selectedValue={initialTime}
              onValueChange={(itemValue) => setInitialTime(itemValue)}
              style={styles.picker}
            >
              {renderInitialTimeOptions()}
            </Picker>
            <Text style={styles.modalText}>Increment (seconds):</Text>
            <Picker
              selectedValue={increment}
              onValueChange={(itemValue) => setIncrement(itemValue)}
              style={styles.picker}
            >
              {renderIncrementOptions()}
            </Picker>
            <TouchableOpacity
              style={[styles.controlButton, styles.modalButton]}
              onPress={handleSaveSettings}
            >
              <Text style={styles.controlButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#161a1d',
  },
  clockContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
  clockText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  controlButton: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2196F3',
  },
});
