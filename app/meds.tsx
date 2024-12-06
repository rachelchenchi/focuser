import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { medications } from '../constants/medications';
import { theme } from './theme/colors';
import { router } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import RNPickerSelect from 'react-native-picker-select';
import { LineChart } from 'react-native-chart-kit';
import { ScrollView, KeyboardAvoidingView } from 'react-native';


const MedsScreen = () => {
  const [activeMeds, setActiveMeds] = useState([]);
  const { token } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [editingMed, setEditingMed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doseLogs, setDoseLogs] = useState({});
  const [expandedMed, setExpandedMed] = useState(null);
  const [selectedDoseTime, setSelectedDoseTime] = useState(new Date());
  const [effects, setEffects] = useState([]);
  const [zones, setZones] = useState([]);
  


  useEffect(() => {
    fetchMedications();
    fetchDoseLogs();
    fetchVisualizationData();
  }, [token]);


  const fetchVisualizationData = async () => {
    try {
        const effectsResponse = await fetch('http://localhost:5000/api/medication-effects', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const zonesResponse = await fetch('http://localhost:5000/api/focus-zones', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!effectsResponse.ok || !zonesResponse.ok) {
            throw new Error('Failed to fetch visualization data.');
        }

        const effectsData = await effectsResponse.json();
        const focusZonesData = await zonesResponse.json();

        // Ensure data structure matches the chart's requirements
        const formattedEffects = effectsData.effects.map((effect) => ({
            label: effect.name,
            values: effect.effect_curve.map((point) => point.level),
            time: effect.effect_curve.map((point) => point.time),
        }));

        setEffects(formattedEffects);
        setZones(focusZonesData.focus_zones);
    } catch (error) {
        Alert.alert('Error', 'Failed to fetch visualization data.');
    }
  };
  
  
  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/medications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch medications.');
      const data = await response.json();
      setActiveMeds(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to fetch medications.');
    } finally {
      setLoading(false);
    }
  };


  const fetchDoseLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/doselogs', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dose logs.');
      const data = await response.json();
      const logsByMedication = data.reduce((acc, log) => {
        acc[log.medication_id] = log.dose_time;
        return acc;
      }, {});
      setDoseLogs(logsByMedication);
    } catch (error) {
      console.error('Error fetching dose logs:', error);
      Alert.alert('Error', 'Failed to fetch dose logs.');
    }
  };


  const handleAddMedication = () => {
    setModalVisible(true);
    setEditingMed(null);
    setSelectedMed('');
    setSelectedDosage('');
    setSelectedFrequency('');
  };


  const handleSaveMedication = async () => {
    if (!selectedMed || !selectedDosage || !selectedFrequency) {
      Alert.alert('Error', 'Please select all fields before saving.');
      return;
    }

    const newMed = {
      name: selectedMed,
      dosage: parseInt(selectedDosage),
      frequency: selectedFrequency,
    };

    try {
      const endpoint = editingMed
        ? `http://localhost:5000/api/medications/${editingMed.id}`
        : 'http://localhost:5000/api/medications';

      const method = editingMed ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMed),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Failed to save medication.');
      }

      const result = await response.json();

      if (editingMed) {
        setActiveMeds((prev) =>
          prev.map((med) => (med.id === editingMed.id ? result : med))
        );
        Alert.alert('Success', 'Medication updated!');
      } else {
        setActiveMeds((prev) => [...prev, result]);
        Alert.alert('Success', 'Medication added!');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error in handleSaveMedication:', error);
      Alert.alert('Error', error.message || 'Failed to save medication.');
    }
  };


  const handleEditMedication = (med) => {
    setEditingMed(med);
    setSelectedMed(med.name);
    setSelectedDosage(med.dosage.toString());
    setSelectedFrequency(med.frequency);
    setModalVisible(true);
  };


  const handleDeactivateMedication = async (med) => {
    try {
      const response = await fetch(`http://localhost:5000/api/medications/${med.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to deactivate medication.');
      setActiveMeds((prev) => prev.filter((item) => item.id !== med.id));
      Alert.alert('Success', 'Medication deactivated!');
    } catch (error) {
      console.error('Error deactivating medication:', error);
      Alert.alert('Error', 'Failed to deactivate medication.');
    }
  };


  const handleLogDose = async (med) => {
    try {
      // Extract hours and minutes from the `selectedDoseTime`
      const hours = selectedDoseTime.getHours();
      const minutes = selectedDoseTime.getMinutes();
  
      console.log(`Logging dose with hours: ${hours}, minutes: ${minutes}`);
  
      // Send only hours and minutes to the backend
      const response = await fetch('http://localhost:5000/api/doselogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medication_id: med.id,
          hours, // Send hours
          minutes, // Send minutes
        }),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Backend Error:', errorResponse);
        throw new Error(errorResponse.message || 'Failed to log dose.');
      }
  
      const result = await response.json();
  
      // Update the local state with the new dose log
      setDoseLogs((prevLogs) => ({
        ...prevLogs,
        [med.id]: result.dose_time,
      }));
  
      // Collapse the inline form
      setExpandedMed(null);
  
      Alert.alert('Success', `Dose logged for ${med.name} (${med.dosage} mg).`);
    } catch (error) {
      console.error('Error logging dose:', error);
      Alert.alert('Error', error.message || 'Failed to log dose.');
    }
  };



  const renderVisualization = () => {
    if (!effects || effects.length === 0) {
      return <Text style={styles.emptyText}>No active doses.</Text>;
    }
  
    return (
      <View style={styles.visualizationContainer}>
        <LineChart
          data={{
            labels: Array.from({ length: 24 }, (_, i) =>
              new Date(Date.now() - 12 * 60 * 60 * 1000 + i * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric' })
            ),
            datasets: effects.map((effect, index) => ({
              data: effect.values,
              color: (opacity = 1) => `rgba(${index * 60}, 99, 255, ${opacity})`,
              strokeWidth: 2,
            })),
          }}
          width={Dimensions.get('window').width - 40}
          height={200}
          chartConfig={{
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: { r: '4' },
          }}
          style={styles.chart}
        />
  
        <FlatList
        data={effects}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>
              {`${item.label || 'Unnamed Medication'} (Last dose: ${item.doseTimes?.[0] || 'N/A'})`}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteLog(item.id)}>
              <Ionicons name="trash-outline" size={18} color="red" />
            </TouchableOpacity>
          </View>
          )}
        />

        <Text style={styles.visualizationTitle}>Medication Effects & Focus Zones</Text>

      </View>
    );
  };
  
  

  const handleDeleteLog = async (logId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/doselogs/${logId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete dose log.');
  
      // Update local dose logs
      setDoseLogs((prevLogs) => {
        const updatedLogs = { ...prevLogs };
        delete updatedLogs[logId];
        return updatedLogs;
      });
  
      // Update visualization effects
      setEffects((prevEffects) =>
        prevEffects.map((effect) => ({
          ...effect,
          values: effect.values.filter((_, idx) => idx !== logId),
          time: effect.time.filter((_, idx) => idx !== logId),
        }))
      );
  
      Alert.alert('Success', 'Dose log deleted successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete dose log.');
    }
  };



  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/home')}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.logo}>FOCUSER</Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person-circle-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Active Medications Section */}
          <View style={styles.medicationsHeader}>
            <Text style={styles.sectionTitle}>Active Medications</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddMedication}>
              <Text style={styles.addButtonText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={activeMeds}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.medItem}>
                  {/* Medication Details */}
                  <View style={styles.medList}>
                    <Image
                      source={medications.find((med) => med.name === item.name)?.icon}
                      style={styles.medListIcon}
                    />
                    <View>
                      <Text style={styles.medListName}>
                        {item.name} ({item.dosage} mg)
                      </Text>
                      {/* Last Dose */}
                      <Text style={styles.lastDoseText}>
                        Last Dose: {doseLogs[item.id] ? new Date(doseLogs[item.id]).toLocaleString() : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  {/* Log Dose Inline Form */}
                  {expandedMed === item.id && (
                    <View style={styles.inlineForm}>
                      <Text style={styles.inlineLabel}>Dose Time</Text>

                      {/* Hour Picker */}
                      <View style={styles.inlinePicker}>
                        <Text style={styles.inlineLabel}>Hour:</Text>
                        <RNPickerSelect
                          style={styles.inlinePicker}
                          onValueChange={(value) => setSelectedDoseTime((prev) => {
                            const updatedDate = new Date(prev);
                            updatedDate.setHours(value);
                            return updatedDate;
                          })}
                          items={Array.from({ length: 24 }, (_, i) => ({
                            label: i.toString().padStart(2, '0'),
                            value: i,
                          }))}
                        />
                      </View>

                      {/* Minute Picker */}
                      <View style={styles.inlinePicker}>
                        <Text style={styles.inlineLabel}>Minute:</Text>
                        <RNPickerSelect
                          style={styles.inlinePicker}
                          onValueChange={(value) => setSelectedDoseTime((prev) => {
                            const updatedDate = new Date(prev);
                            updatedDate.setMinutes(value);
                            return updatedDate;
                          })}
                          items={Array.from({ length: 60 }, (_, i) => ({
                            label: i.toString().padStart(2, '0'),
                            value: i,
                          }))}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.logButton}
                        onPress={() => handleLogDose(item)}
                      >
                        <Text style={styles.logButtonText}>Log Dose</Text>
                      </TouchableOpacity>
                    </View>
                  )}


                  {/* Action Icons */}
                  <View style={styles.actionIcons}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setExpandedMed((prev) => (prev === item.id ? null : item.id))
                      }
                    >
                      <Ionicons name="checkbox-outline" size={25} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEditMedication(item)}
                    >
                      <Ionicons name="create-outline" size={25} color={theme.colors.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeactivateMedication(item)}
                    >
                      <Ionicons name="trash-outline" size={25} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No active medications.</Text>
              }
            />
          )}


          {/* Active Doses Section */}
          {/* <Text style={styles.sectionTitle}>Active Doses (Last 12 Hours)</Text> */}
          {/* Visualization */}
          {/* {!effects || effects.length === 0 && <Text style={styles.emptyText}>No active doses.</Text>} */}
          {/* {renderVisualization()} */}

          {/* Notification Placeholder */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => Alert.alert('Set Notifications', 'Feature coming soon!')}
          >
            <Text style={styles.notificationButtonText}>Set Peak Notifications</Text>
          </TouchableOpacity>

          {/* Modal for Adding/Editing Medications */}
          <Modal visible={isModalVisible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>
                  {editingMed ? 'Edit Medication' : 'Add Medication'}
                </Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Select Medication</Text>
                  <View style={styles.medOptionsRow}>
                    {medications.map((med) => (
                      <TouchableOpacity
                        key={med.name}
                        style={[
                          styles.medOption,
                          selectedMed === med.name && styles.selectedMedOption,
                        ]}
                        onPress={() => {
                          setSelectedMed(med.name);
                          setSelectedDosage(med.defaultDosage.toString());
                          setSelectedFrequency(med.frequencyOptions[0]);
                        }}
                      >
                        <Image source={med.icon} style={styles.medIcon} />
                        <Text style={styles.medName}>{med.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Select Dosage</Text>
                  <Picker
                    style={styles.dropdown}
                    selectedValue={selectedDosage}
                    onValueChange={(value) => setSelectedDosage(value)}
                  >
                    {medications
                      .find((med) => med.name === selectedMed)
                      ?.dosageForms.map((dosage) => (
                        <Picker.Item key={dosage} label={`${dosage} mg`} value={dosage.toString()} />
                      ))}
                  </Picker>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Select Frequency</Text>
                  <Picker
                    style={styles.dropdown}
                    selectedValue={selectedFrequency}
                    onValueChange={(value) => setSelectedFrequency(value)}
                  >
                    {medications
                      .find((med) => med.name === selectedMed)
                      ?.frequencyOptions.map((freq) => (
                        <Picker.Item key={freq} label={freq} value={freq} />
                      ))}
                  </Picker>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedication}>
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.syncButton} onPress={() => Alert.alert('Sync to Reminders', 'Feature coming soon!')}>
                    <Text style={styles.buttonText}>Sync to Reminders</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF2',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
      padding: 8,
  },
  logo: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#D4D41A',
  },
  profileButton: {
      padding: 8,
  },
  medList: {
    flexDirection: 'row',    
    alignItems: 'center',
    // marginHorizontal: 30,
    marginVertical: 5,
  },
  emptyText: {    
      fontSize: 18,    
      color: '#666',
      textAlign: 'center',
      marginTop:20,
  },
  medItem: {
    backgroundColor: '#FFF',
    borderColor: '#D4D41A',
    borderBottomWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 30,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medListName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    marginBottom: 8,
  },
  medListIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4D41A',
    marginVertical: 8,
  },
  medName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 30,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  medicationsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // marginBottom: 20,
      paddingHorizontal: 10,
  },
  sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      padding: 30,
  },
  addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginHorizontal: 30,
  },
  addButtonText: {
      color: theme.colors.text.inverse,
      fontSize: 18,
      fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalSection: {
    marginBottom: 20,
  },
  medOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 30,
  },
  medOption: {
    width: '20%',
    alignItems: 'center',
    // marginLeft: 30,
    // marginHorizontal: 30,
    marginVertical: 8,
  },
  medIcon: {
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: '#D4D41A',
    marginVertical: 8,
  },
  selectedMedOption: {    
      backgroundColor: '#D4D41A',
      borderColor: '#D4D41A',
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 30,
    marginVertical: 8,
  },
  dropdownText: {
    fontSize: 18,
    color: '#333',
  },
  modalLabel: {    
      fontSize: 18,    
      color: '#333',
      marginBottom: 8,
      marginLeft: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 30,
    marginVertical: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 30,
    marginVertical: 8,
  },
  syncButton: {
    backgroundColor: '#FFD700',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    // flex: 1,
    marginHorizontal: 20,
    marginVertical: 8,  
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    alignItems: 'center',
    
  },
  lastDoseText: { 
    fontSize: 12, 
    color: '#666',
    marginHorizontal: 15,
  },
  inlineForm: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  inlineLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inlinePicker: {
    height: 50,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#333',
  },
  logButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationButton: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    // flex: 1,
    // maxHeight: '8%',
    alignSelf: 'center',
    maxWidth: '50%',
    marginTop: '30%',
    // marginBottom: 30,  
  },
  notificationButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  visualizationContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: '30%',
  },
  visualizationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    // padding: 30,
  },
  legendContainer: {
    flex: 1,
    backgroundColor: '#FFFEF2',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  legendItem: {
    backgroundColor: '#FFF',
    borderColor: '#D4D41A',
    borderBottomWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 30,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12, 
    color: '#666',
    marginHorizontal: 30,
  },
  activeDoses: {
    flex: 1,
    flexDirection: 'row',    
    alignItems: 'center',
    // marginHorizontal: 30,
    marginBottom: 30,
  },
  doseText: {
    fontSize: 18,    
    color: '#666',
    textAlign: 'center',
    marginTop:20,
  },
  chart: {

  }, 
});  

export default MedsScreen;
