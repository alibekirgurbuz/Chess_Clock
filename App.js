import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, StatusBar, useColorScheme, SafeAreaView, Platform } from 'react-native';
import { SystemNavigationBar } from 'react-native-system-navigation-bar';
import Feather from '@expo/vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av'; // Import Audio from expo-av
import * as NavigationBar from 'expo-navigation-bar';  // Yeni import

export default function App() {
  const [topTime, setTopTime] = useState(300.0); // Default start time 5 minutes
  const [bottomTime, setBottomTime] = useState(300.0);
  const [activeClock, setActiveClock] = useState(null);
  const [initialTime, setInitialTime] = useState(5); // Initial time in minutes
  const [increment, setIncrement] = useState(0); // Increment time in seconds
  const [modalVisible, setModalVisible] = useState(false);

  const [buttonClickSound, setButtonClickSound] = useState();
  const [pauseSound, setPauseSound] = useState();
  const [refreshSound, setRefreshSound] = useState();  

  // Sound object reference for button click and pause sounds
  const [sound, setSound] = useState();
  const colorScheme = useColorScheme();

  // increment değişikliğini izleyen useEffect'i buraya taşıyoruz
  useEffect(() => {
    console.log("Increment değeri:", increment);
  }, [increment]);

  // Önce state'e yeni bir değişken ekleyelim
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Özel alert fonksiyonumuzu oluşturalım
  const showCustomAlert = (title, message, buttons) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  // Function to load and play a sound based on the file passed
  async function playSound(soundFile) {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.warn("Ses çalma hatası:", error);
      // Ses çalınamasa bile uygulamanın çalışmaya devam etmesini sağla
    }
  }

  useEffect(() => {
    async function loadSounds() {
      const { sound: btnSound } = await Audio.Sound.createAsync(require('./assets/sounds/ButtonClickUp.mp3'));
      const { sound: pauseSoundObj } = await Audio.Sound.createAsync(require('./assets/sounds/PauseClick.mp3'));
      const { sound: refreshSoundObj } = await Audio.Sound.createAsync(require('./assets/sounds/refreshClick1.mp3'));
  
      setButtonClickSound(btnSound);
      setPauseSound(pauseSoundObj);
      setRefreshSound(refreshSoundObj);
    }
  
    loadSounds();
  
    return () => {
      buttonClickSound?.unloadAsync();
      pauseSound?.unloadAsync();
      refreshSound?.unloadAsync();
    };
  }, []);

  const getBackgroundColor = (clock) => {
    if (clock === 'top') {
      if (topTime <= 0) return '#dc2f02'; // Daha parlak kırmızı
      return activeClock === 'top' ? '#FFD460' : '#8E9AAF';
    } else {
      if (bottomTime <= 0) return '#dc2f02'; // Daha parlak kırmızı
      return activeClock === 'bottom' ? '#FFD460' : '#8E9AAF';
    }
  };

  useEffect(() => {
    if (!activeClock) return;
  
    const timer = setInterval(() => {
      if (activeClock === 'top') {
        setTopTime(prev => Math.max(0, prev - 0.1)); // 0'ın altına düşmesini engelle
      } else {
        setBottomTime(prev => Math.max(0, prev - 0.1));
      }
    }, 100);
  
    return () => clearInterval(timer);
  }, [activeClock]); // Sadece aktif saat değiştiğinde çalışır.
  

  const handlePress = (clock) => {
    playSound(require('./assets/sounds/ButtonClickUp.mp3')); // Play the default button click sound
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
    showCustomAlert(
      "Yenile",
      "Süreleri sıfırlamak istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        },
        {
          text: "Yenile",
          onPress: () => {
            playSound(require('./assets/sounds/refreshClick1.mp3'));
            setTopTime(initialTime * 60);
            setBottomTime(initialTime * 60);
            setActiveClock(null);
            setAlertConfig(prev => ({ ...prev, visible: false }));
          },
        },
      ]
    );
  };
  

  const handleSettings = () => {
    setModalVisible(true);
  };

  const handleSaveSettings = () => {
    const validInitialTime = isNaN(initialTime) || initialTime <= 0 ? 5 : initialTime;
    // increment değerini doğrudan sayıya çevirip kontrol ediyoruz
    const validIncrement = parseInt(increment, 10);
    const finalIncrement = isNaN(validIncrement) ? 0 : validIncrement;

    setTopTime(validInitialTime * 60);
    setBottomTime(validInitialTime * 60);
    setIncrement(finalIncrement);

    setModalVisible(false);
    setActiveClock(null);
  };
  

  const renderInitialTimeOptions = () => {
    const options = [];
    options.push(<Picker.Item key="10sec" label="10 saniye" value={1/6} />);
    options.push(<Picker.Item key="30sec" label="30 saniye" value={1/2} />);
    
    for (let i = 1; i <= 90; i++) {
      options.push(<Picker.Item key={i} label={`${i} dakika`} value={i} />);
    }
    return options;
  };

  const renderIncrementOptions = () => {
    const options = [];
    // key ve value değerlerini string olarak ayarlıyoruz
    for (let i = 0; i <= 60; i++) {
      options.push(
        <Picker.Item 
          key={i.toString()} 
          label={`${i} saniye`} 
          value={i.toString()} 
        />
      );
    }
    return options;
  };

  const formatTime = (seconds) => {
    // Süre 0 ise bayrak ikonu göster
    if (seconds <= 0) {
      return (
        <View style={styles.timeContainer}>
          <View style={styles.flagContainer}>
            <Feather name="flag" size={50} color="#fff" />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.clockText}>0:00</Text>
            <Text style={styles.millisecText}>.0</Text>
          </View>
        </View>
      );
    }
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 10);
    
    return (
      <View style={styles.timeContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.clockText}>
            {`${minutes}:${secs < 10 ? '0' : ''}${secs}`}
          </Text>
          <Text style={styles.millisecText}>{`.${millisecs}`}</Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const hideNavigationBar = async () => {
      try {
        if (Platform.OS === 'android') {
          // Navigation bar'ı şeffaf yap ve gizle
          await NavigationBar.setBackgroundColorAsync('transparent');
          await NavigationBar.setVisibilityAsync('hidden');
          
          // Tam ekran modu için
          await NavigationBar.setBehaviorAsync('overlay');
        }
        
        // StatusBar'ı gizle
        StatusBar.setHidden(true);
      } catch (error) {
        console.warn('Navigation bar gizlenemedi:', error);
      }
    };

    hideNavigationBar();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#161a1d' }]}>
      <StatusBar hidden={true} />
      <TouchableOpacity
        style={[styles.clockContainer1, { backgroundColor: getBackgroundColor('top') }]}
        onPress={() => handlePress('top')}
        disabled={activeClock === 'bottom' || topTime === 0 || bottomTime === 0}
      >
        {formatTime(topTime)}
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
        style={[styles.clockContainer2, { backgroundColor: getBackgroundColor('bottom') }]}
        
        onPress={() => handlePress('bottom')}
        disabled={activeClock === 'top' || topTime === 0 || bottomTime === 0}
      >
        {formatTime(bottomTime)}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Başlangıç Süresi</Text>
            <Picker
              selectedValue={initialTime}
              onValueChange={(itemValue) => setInitialTime(itemValue)}
              style={styles.picker}
              dropdownIconColor="#FFD460"
              mode="dropdown"
              itemStyle={styles.pickerItem}
            >
              {renderInitialTimeOptions()}
            </Picker>
            <Text style={styles.modalText}>Hamle Başı Ekleme</Text>
            <Picker
              selectedValue={increment}
              onValueChange={(itemValue) => setIncrement(itemValue)}
              style={styles.picker}
              dropdownIconColor="#FFD460"
              mode="dropdown"
              itemStyle={styles.pickerItem}
            >
              {renderIncrementOptions()}
            </Picker>
            <TouchableOpacity
              style={[styles.controlButton, styles.modalButton]}
              onPress={handleSaveSettings}
            >
              <Text style={styles.controlButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={alertConfig.visible}
        onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <View style={styles.alertButtonContainer}>
              {alertConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    index === alertConfig.buttons.length - 1 && styles.alertButtonLast
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={styles.alertButtonText}>{button.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#161a1d',
    margin: 0,
    padding: 0,
  },
  clockContainer1: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    transform: [{ scaleX: -1 }, { scaleY: -1 }]
  },
  clockContainer2: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFD460',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161a1d',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 26, 29, 0.9)',
  },
  modalView: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#8E9AAF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
    textAlign: 'center',
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 20,
    backgroundColor: 'gray',
    color: 'black',
    borderRadius: 8,
  },
  modalButton: {
    backgroundColor: 'orange',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  millisecText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  flagContainer: {
    marginBottom: 10,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 44, 49, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#8E9AAF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  alertTitle: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    color: 'black',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButtonContainer: {
    width: '100%',
  },
  alertButton: {
    backgroundColor: 'gray',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  alertButtonLast: {
    backgroundColor: 'orange',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerItem: {
    backgroundColor: '#161a1d',
    color: '#FFD460',
    fontSize: 18,
    height: 120,
  },
});
