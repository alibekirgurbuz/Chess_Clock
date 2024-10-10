import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, StatusBar } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av'; // Import Audio from expo-av

export default function App() {
  const [topTime, setTopTime] = useState(300); // Default start time 5 minutes
  const [bottomTime, setBottomTime] = useState(300);
  const [activeClock, setActiveClock] = useState(null);
  const [initialTime, setInitialTime] = useState(5); // Initial time in minutes
  const [increment, setIncrement] = useState(0); // Increment time in seconds
  const [modalVisible, setModalVisible] = useState(false);

  // Sound object reference for button click and pause sounds
  const [sound, setSound] = useState();

  // Function to load and play a sound based on the file passed
  async function playSound(soundFile) {
    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      setSound(sound);
      await sound.playAsync(); // Play the sound
    } catch (error) {
      console.error("Error loading or playing sound:", error); // Log error for debugging
    }
  }

  // Clean up sound
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync(); // Unload sound when component unmounts
        }
      : undefined;
  }, [sound]);

  const getBackgroundColor = (clock) => {
    if (clock === 'top') {
      if (topTime === 0) return '#6a040f'; // Red for out-of-time player
      return activeClock === 'top' ? '#FFD460' : '#8E9AAF';
    } else {
      if (bottomTime === 0) return '#6a040f'; // Red for out-of-time player
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
      Alert.alert('Game Over', `${activeClock === 'top' ? 'Bottom' : 'Top'} player's time is up. Game over.`);
      setActiveClock(null);
    }

    return () => clearInterval(timer);
  }, [activeClock, topTime, bottomTime]);

  const handlePress = (clock) => {
    playSound(require('./assets/sounds/ButonSes.mp3')); // Play the default button click sound
    if (topTime > 0 && bottomTime > 0) {
      setActiveClock(clock === 'top' ? 'bottom' : 'top');
      if (clock === 'top') {
        setTopTime((prev) => prev + increment);
      } else {
        setBottomTime((prev) => prev + increment);
      }
    }
  };

  const handlePause = () => {
    playSound(require('./assets/sounds/PauseClick.mp3')); // Play the pause sound
    setActiveClock(null);
  };

  const handleReset = () => {
    Alert.alert(
      "Uyarı", // Başlık
      "Yenilemek istediğinizden emin misiniz?", // Mesaj
      [
        {
          text: "Hayır", // Hayır butonu
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel", // Cancel stili
        },
        {
          text: "Evet", // Evet butonu
          onPress: () => {
            playSound(require('./assets/sounds/refreshClick1.mp3')); // Sesi çal
            setTopTime(initialTime * 60); // Zamanı resetle
            setBottomTime(initialTime * 60);
            setActiveClock(null);
          },
        },
      ],
      { cancelable: false }
    );
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
    for (let i = 0; i <= 60; i++) {
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
            <Text style={styles.modalText}>Süre:</Text>
            <Picker
              selectedValue={initialTime}
              onValueChange={(itemValue) => setInitialTime(itemValue)}
              style={styles.picker}
            >
              {renderInitialTimeOptions()}
            </Picker>
            <Text style={styles.modalText}>Ekleme:</Text>
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
