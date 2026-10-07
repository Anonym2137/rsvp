import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator, ActionsheetScrollView } from './ui/actionsheet';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, type PressableProps, type TextInputProps, type ViewProps } from 'react-native';
import { Button } from './ui/button';
import { Pressable as GluestackPressable } from './ui/pressable';
import { Card } from './ui/card';
import { Input, InputField } from './ui/input';
import { Textarea, TextareaInput } from './ui/textarea';
import { Badge } from './ui/badge';
import { Heading } from './ui/heading';
import { useTheme } from '../hooks/useTheme';
import { Design } from '../constants/theme';

// Native prop adapters keep callers and their callbacks stable during the redesign.
export function Action({ style, disabled, ...props }: PressableProps) {
  const { colors } = useTheme();
  if (typeof style === 'function') return <GluestackPressable accessibilityRole="button" {...props} disabled={disabled} style={style} />;
  return <Button {...props} isDisabled={!!disabled} variant="ghost"
    style={[{ minHeight: 44, flexDirection: 'column', borderRadius: Design.radius.control, borderColor: colors.border }, style]} />;
}
export function Surface({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <Card {...props} style={StyleSheet.flatten([{
    backgroundColor: colors.surface, borderColor: colors.borderSubtle,
    borderWidth: 1, borderRadius: Design.radius.card,
  }, style])} />;
}
export function Field({ style, multiline, ...props }: TextInputProps) {
  const { colors } = useTheme();
  const flat = StyleSheet.flatten(style) ?? {};
  const outer = { backgroundColor: flat.backgroundColor ?? (flat.flex ? 'transparent' : colors.inputBg),
    borderColor: flat.borderColor ?? colors.border, borderWidth: flat.borderWidth ?? (flat.flex ? 0 : 1),
    borderRadius: flat.borderRadius ?? Design.radius.control, flex: flat.flex,
    width: flat.width, height: flat.height, minHeight: multiline ? 140 : 48 };
  const inner = [style, { borderWidth: 0, backgroundColor: 'transparent', flex: 1, fontSize: 15, color: colors.foreground }];
  return multiline ? <Textarea className="p-0" style={outer}><TextareaInput {...props} multiline style={inner} /></Textarea> :
    <Input className="p-0" style={outer}><InputField {...props} style={inner} /></Input>;
}
export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 }}>
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.accentEmerald, marginBottom: 6 }} />
      <Heading style={{ color: colors.foreground, fontSize: Design.type.title, fontWeight: '800' }}>{title}</Heading>
      {!!subtitle && <Text style={{ color: colors.mutedFg, fontSize: 14, lineHeight: 21 }}>{subtitle}</Text>}
    </View>{action}
  </View>;
}
export function StatusBadge({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Badge className="rounded-full" style={{ backgroundColor: colors.primaryMuted, borderColor: colors.primary, padding: 8 }}>{children}</Badge>;
}

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <Actionsheet isOpen={visible} onClose={onClose}>
    <ActionsheetBackdrop />
    <ActionsheetContent className="p-0" style={{ backgroundColor: colors.surface, borderColor: colors.border,
      borderTopLeftRadius: Design.radius.sheet, borderTopRightRadius: Design.radius.sheet, alignItems: 'stretch', padding: 24, paddingBottom: 24 + insets.bottom }}>
      <ActionsheetDragIndicatorWrapper><ActionsheetDragIndicator /></ActionsheetDragIndicatorWrapper>
      <ActionsheetScrollView>{children}</ActionsheetScrollView>
    </ActionsheetContent>
  </Actionsheet>;
}
