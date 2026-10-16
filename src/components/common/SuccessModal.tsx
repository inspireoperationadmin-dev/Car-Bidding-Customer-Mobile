import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  infoBadgeText?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title = 'Request Submitted!',
  message = 'Your request has been broadcasted to verified mechanics in your area. Quotes will start arriving soon.',
  infoBadgeText = 'Average first quote arrives in ~15 mins',
  primaryButtonText = 'View My Requests',
  secondaryButtonText = 'Back to Home',
  onPrimaryPress,
  onSecondaryPress,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.2)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 4.5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous subtle pulse on outer halo
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.75);
      iconScaleAnim.setValue(0.2);
    }
  }, [visible, fadeAnim, scaleAnim, iconScaleAnim, pulseAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose || onPrimaryPress}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Top Decorative Header Accent */}
          <LinearGradient
            colors={[theme.colors.gradBtnStart, theme.colors.primary, theme.colors.gradBtnEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopAccent}
          />

          {/* ICON BADGE WITH GLOW HALO */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseHalo,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconBadgeWrapper,
                {
                  transform: [{ scale: iconScaleAnim }],
                },
              ]}>
              <LinearGradient
                colors={['#34D399', '#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}>
                <Icon name="check" size={36} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* TITLE & MESSAGE */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          {/* INFO BADGE */}
          {!!infoBadgeText && (
            <View style={styles.infoBadge}>
              <Icon name="clock" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.infoBadgeText}>{infoBadgeText}</Text>
            </View>
          )}

          {/* PRIMARY BUTTON */}
          <TouchableOpacity
            style={styles.primaryButtonWrapper}
            onPress={onPrimaryPress}
            activeOpacity={0.85}>
            <LinearGradient
              colors={theme.gradients.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}>
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
              <Icon name="arrow-right" size={18} color="#FFFFFF" style={styles.buttonArrow} />
            </LinearGradient>
          </TouchableOpacity>

          {/* SECONDARY BUTTON */}
          {!!onSecondaryPress && !!secondaryButtonText && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondaryPress}
              activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 41, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  cardContainer: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',

    // Premium Drop Shadow
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
  },

  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },

  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  pulseHalo: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },

  iconBadgeWrapper: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },

  iconGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.title,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  messageText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
    paddingHorizontal: 8,
  },

  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
  },

  infoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSubtle,
  },

  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  buttonArrow: {
    marginLeft: 8,
  },

  secondaryButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },
});
