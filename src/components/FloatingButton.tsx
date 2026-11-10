import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/Colors';
import { layout } from '../styles/layout';
import { useNavigation } from '@react-navigation/native';

export default function FloatingButton() {
  const navigation = useNavigation<any>();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
      Animated.spring(animation, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true
      }).start();
      setIsOpen(false);
  };

  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        }),
      },
    ],
  };

  const recipeStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70],
        }),
      },
    ],
    opacity: animation,
  };

  const dogStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -140],
        }),
      },
    ],
    opacity: animation,
  };
  
  const fadeAnim = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <>
      <Modal visible={isOpen} transparent={true} animationType="none">
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.dimBackground, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContentContainer} pointerEvents="box-none">
             {/* Sub Button 2: Dog */}
             <Animated.View style={[styles.buttonSubContainer, dogStyle]}>
                <TouchableOpacity 
                    style={styles.buttonSub} 
                    onPress={() => {
                        closeMenu();
                        navigation.navigate('AddDogScreen'); 
                    }}
                >
                    <Ionicons name="paw" size={20} color={colors.textInvert} />
                    <Text style={styles.label}>강아지 등록</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Sub Button 1: Recipe */}
            <Animated.View style={[styles.buttonSubContainer, recipeStyle]}>
                <TouchableOpacity 
                    style={styles.buttonSub}
                    onPress={() => {
                        closeMenu();
                        navigation.navigate('AddRecipeScreen');
                    }}
                >
                <Ionicons name="restaurant" size={20} color={colors.textInvert} />
                <Text style={styles.label}>레시피 추가</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Main FAB (Close) */}
            <TouchableOpacity
                style={styles.buttonMainExtended} // Extended style for open state? No, keep round for consistency
                activeOpacity={0.9}
                onPress={toggleMenu}
            >
                <Animated.View style={rotation}>
                    <Ionicons name="add" size={32} color={colors.textInvert} />
                </Animated.View>
            </TouchableOpacity>
        </View>
      </Modal>

      {/* Main FAB (Open) - Extended with Text */}
      {!isOpen && (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.buttonMainExtended} 
                activeOpacity={0.9}
                onPress={toggleMenu}
            >
                <Ionicons name="add" size={24} color={colors.textInvert} />
                <Text style={styles.mainLabel}>추가</Text>
            </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 9999,
  },
  
  modalContentContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24, 
    alignItems: 'flex-end', // Align items to the right side
    zIndex: 10000,
  },

  dimBackground: {
      flex: 1,
      backgroundColor: '#000',
  },

  // Extended FAB Style
  buttonMainExtended: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    ...layout.shadow.default,
    minWidth: 56, // Ensure it can be round if needed
    height: 56,
  },
  
  mainLabel: {
      color: colors.textInvert,
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
  },
  
  buttonSubContainer: {
    position: 'absolute',
    bottom: 8, 
    right: 0,
    alignItems: 'flex-end', 
    width: 200, 
    paddingRight: 8, // Adjust alignment relative to the main button center
  },
  
  buttonSub: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...layout.shadow.default,
    justifyContent: 'center',
  },
  
  label: {
    color: colors.textInvert,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});
