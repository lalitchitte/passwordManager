import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TextInput} from 'react-native-paper';

const App = () => {
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwords, setPasswords] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    loadPasswords();
  }, []);

  // const maskPassword = pass => {
  //   let str = '';
  //   for (let index = 0; index < pass.length; index++) {
  //     str += '*';
  //   }
  //   return str;
  // };

  const maskPassword = pass => {
    if (pass === undefined || pass === null) {
      return ''; // Return an empty string if pass is undefined or null
    }
    return '*'.repeat(pass.length);
  };

  const copyText = async txt => {
    try {
      await Clipboard.setString(txt);
      setAlertVisible(true);
      setTimeout(() => {
        setAlertVisible(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  const deletePassword = async website => {
    const updatedPasswords = passwords.filter(e => e.website !== website);
    await savePasswords(updatedPasswords);
    setPasswords(updatedPasswords);

    alert(`Successfully deleted ${website}'s password`);
  };

  // const showPasswords = () => {
  //   setPasswords([]);
  //   setWebsite('');
  //   setUsername('');
  //   setPassword('');
  //   setEditing(false);
  //   setEditIndex(null);
  // };

  const savePasswords = async updatedPasswords => {
    try {
      await AsyncStorage.setItem('passwords', JSON.stringify(updatedPasswords));
    } catch (error) {
      console.error('Error saving passwords:', error);
    }
  };

  const loadPasswords = async () => {
    try {
      const storedPasswords = await AsyncStorage.getItem('passwords');
      if (storedPasswords !== null) {
        const parsedPasswords = JSON.parse(storedPasswords);
        if (
          typeof parsedPasswords === 'object' &&
          !Array.isArray(parsedPasswords)
        ) {
          // Convert the single object into an array of objects
          const passwordsArray = Object.keys(parsedPasswords).map(key => ({
            website: parsedPasswords.website,
            username: parsedPasswords.username,
            password: parsedPasswords.password,
          }));
          setPasswords(prevPasswords => {
            // Filter out duplicates by comparing website, username, and password
            const uniquePasswords = [
              ...prevPasswords,
              ...passwordsArray,
            ].reduce((acc, current) => {
              const x = acc.find(
                item =>
                  item.website === current.website &&
                  item.username === current.username &&
                  item.password === current.password,
              );
              if (!x) {
                return acc.concat([current]);
              } else {
                return acc;
              }
            }, []);
            return uniquePasswords;
          });
        } else if (Array.isArray(parsedPasswords)) {
          setPasswords(parsedPasswords);
        } else {
          console.log(
            'Invalid format for stored passwords. Expected an array.',
          );
          setPasswords([]);
        }
      } else {
        console.log('No passwords found in AsyncStorage.');
        setPasswords([]);
      }
    } catch (error) {
      console.error('Error loading passwords:', error);
      setPasswords([]);
    }
  };

  const savePassword = async () => {
    // Check if any of the input fields is empty
    if (!website || !username || !password) {
      alert('Please fill in all fields.');
      return;
    }

    if (editing && editIndex !== null) {
      const updatedPasswords = [...passwords];
      updatedPasswords[editIndex] = {
        website,
        username,
        password,
      };
      await savePasswords(updatedPasswords);
      setPasswords(updatedPasswords);
      setEditing(false);
      setEditIndex(null);
    } else {
      const newPassword = {
        website,
        username,
        password,
      };
      const newPasswords = [...passwords, newPassword];
      await savePasswords(newPassword);
      setPasswords(newPasswords);
    }
    setWebsite('');
    setUsername('');
    setPassword('');
  };

  const editPassword = index => {
    setEditing(true);
    setEditIndex(index);
    setWebsite(passwords[index].website);
    setUsername(passwords[index].username);
    setPassword(passwords[index].password);
  };

  const renderPasswordList = () => {
    if (!passwords || !Array.isArray(passwords)) {
      console.log('Passwords array is not properly initialized.');
      return null; // or display a message indicating that no passwords are available
    }

    return passwords.map((item, index) => (
      <View style={styles.passwordItem} key={index}>
        <View style={styles.listItem}>
          <Text style={styles.listLabel}>Website:</Text>
          <Text style={styles.listValue}>{item.website}</Text>
          <TouchableOpacity
            style={styles.copyIcon}
            onPress={() => copyText(item.website)}>
            <Icon name="copy" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listLabel}>Username:</Text>
          <Text style={styles.listValue}>{item.username}</Text>
          <TouchableOpacity
            style={styles.copyIcon}
            onPress={() => copyText(item.username)}>
            <Icon name="copy" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listLabel}>Password:</Text>
          <Text style={styles.listValue}>{maskPassword(item.password)}</Text>
          <TouchableOpacity
            style={styles.copyIcon}
            onPress={() => copyText(item.password)}>
            <Icon name="copy" size={20} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editPassword(index)}>
            <Icon name="edit" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePassword(item.website)}>
            <Icon name="trash" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.heading}>Password Manager</Text>
        <Text style={styles.subHeading}>
          Your Passwords
          {alertVisible && <Text id="alert"> (Copied!)</Text>}
        </Text>
        {passwords.length === 0 ? (
          <Text style={styles.noData}>No Passwords To Show</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>{renderPasswordList()}</View>
          </ScrollView>
        )}

        <Text style={styles.subHeading}>
          {editing ? 'Edit Password' : 'Add a Password'}
        </Text>
        <TextInput
          mode="outlined"
          outlineColor="black"
          activeOutlineColor="green"
          style={styles.input}
          label="Website"
          value={website}
          onChangeText={text => setWebsite(text)}
        />

        <TextInput
          style={styles.input}
          mode="outlined"
          outlineColor="black"
          activeOutlineColor="green"
          label="Username"
          value={username}
          onChangeText={text => setUsername(text)}
        />

        <TextInput
          style={styles.input}
          mode="outlined"
          outlineColor="black"
          activeOutlineColor="green"
          label="Password"
          secureTextEntry={true}
          value={password}
          onChangeText={text => setPassword(text)}
        />

        <TouchableOpacity style={styles.submitButton} onPress={savePassword}>
          <Text style={styles.submitButtonText}>
            {editing ? 'Update Password' : 'Add Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 15,
  },
  content: {
    margin: 10,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subHeading: {
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  noData: {
    fontSize: 17,
    fontStyle: 'italic',
    marginTop: 10,
    alignSelf: 'center',
    color: '#666',
  },
  table: {
    margin: 5,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 5,
    marginTop: 10,
  },
  passwordItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  listLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    fontSize: 19,
  },
  listValue: {
    flex: 1,
    fontSize: 18,
    color: '#444',
    paddingLeft: 10,
  },
  copyIcon: {
    marginRight: 10,
    paddingLeft: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 4,
    padding: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: 'blue',
    borderRadius: 4,
    padding: 5,
    marginRight: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  input: {
    borderWidth: 2,
    borderColor: '#eee',
    paddingLeft: 15,
    marginTop: 10,
    marginVertical: 8,
    fontSize: 16,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  submitButton: {
    backgroundColor: 'green',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 15,
    shadowColor: 'black',
    shadowOffset: {width: 2, height: 2},
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default App;
