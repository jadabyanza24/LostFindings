import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useVerification } from '../lib/useVerification';

const TAB_BAR_HEIGHT = 64;
const INDICATOR_SIZE = 48;
const HORIZONTAL_INSET = 24;
const TAB_BAR_PADDING = 8;

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', inactive: 'home-outline' },
  chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { requireVerified } = useVerification();
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const scales = useRef<Record<string, Animated.Value>>({}).current;

  const routes = state.routes.filter((route: any) => {
    const options = descriptors[route.key]?.options;
    return route.name !== 'admin' && options?.href !== null;
  });
  const activeRoute = state.routes[state.index];
  const activeIndex = Math.max(0, routes.findIndex((route: any) => route.key === activeRoute?.key));
  const itemWidth = barWidth > 0 ? (barWidth - TAB_BAR_PADDING * 2) / routes.length : 0;

  routes.forEach((route: any) => {
    if (!scales[route.key]) scales[route.key] = new Animated.Value(route.key === activeRoute?.key ? 1.12 : 1);
  });

  useEffect(() => {
    if (!itemWidth) return;

    Animated.spring(indicatorX, {
      toValue: TAB_BAR_PADDING + itemWidth * activeIndex + (itemWidth - INDICATOR_SIZE) / 2,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();

    routes.forEach((route: any) => {
      Animated.spring(scales[route.key], {
        toValue: route.key === activeRoute?.key ? 1.12 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }).start();
    });
  }, [activeIndex, activeRoute?.key, itemWidth]);

  const handlePress = (route: any, isFocused: boolean) => {
    if (route.name === 'post') {
      requireVerified(() => router.push('/items/new'));
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return (
    <View
      onLayout={event => setBarWidth(event.nativeEvent.layout.width)}
      style={[s.container, { bottom: Math.max(insets.bottom, 8) + 6 }]}
    >
      {barWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[s.indicator, { transform: [{ translateX: indicatorX }] }]}
        />
      )}

      {routes.map((route: any) => {
        const isFocused = route.key === activeRoute?.key;
        const isPost = route.name === 'post';
        const icon = isPost ? 'add' : isFocused ? ICONS[route.name]?.active : ICONS[route.name]?.inactive;
        const color = isPost ? '#111322' : isFocused ? colors.accent : 'rgba(226,228,240,0.58)';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => handlePress(route, isFocused)}
            style={[s.item, { width: itemWidth || undefined }]}
          >
            <Animated.View
              style={[
                s.iconWrap,
                isPost && s.postButton,
                { transform: [{ scale: scales[route.key] || 1 }] },
              ]}
            >
              <Ionicons name={icon} size={isPost ? 32 : 28} color={color} />
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: HORIZONTAL_INSET,
    right: HORIZONTAL_INSET,
    height: TAB_BAR_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: TAB_BAR_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(34,36,58,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: TAB_BAR_HEIGHT / 2,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  indicator: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2,
    left: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: 'rgba(170,180,240,0.18)',
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
  iconWrap: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: colors.accent,
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});

