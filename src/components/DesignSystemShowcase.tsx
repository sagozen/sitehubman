/**
 * Design System Showcase
 * Interactive demo of all redesigned components
 * Use this to preview and test the new design system
 */

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';

import { AppButtonV2 } from '@/src/components/AppButtonV2';
import { AppCardV2, CompactCard, StandardCard, HeroCard, FloatingCard } from '@/src/components/AppCardV2';
import { AppInputV2, SearchInputV2, PasswordInputV2 } from '@/src/components/AppInputV2';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, stack, row, padding, gap } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export function DesignSystemShowcase() {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  const [searchValue, setSearchValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  return (
    <ScrollView
      style={{ backgroundColor: getColor('background', mode) }}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.section}>
        <MonoText variant="display" weight="bold">
          Design System V2
        </MonoText>
        <MonoText variant="body" tone="muted" style={{ marginTop: tokens.spacing[2] }}>
          Premium SaaS quality components with world-class design
        </MonoText>
      </View>

      {/* Buttons Section */}
      <View style={styles.section}>
        <MonoText variant="h2" weight="semibold" style={styles.sectionTitle}>
          Buttons
        </MonoText>

        {/* Primary Buttons */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Primary Variants
          </MonoText>
          <View style={row(3, 'center')}>
            <AppButtonV2
              label="Primary"
              variant="primary"
              onPress={() => Alert.alert('Primary pressed')}
            />
            <AppButtonV2
              label="Secondary"
              variant="secondary"
              onPress={() => Alert.alert('Secondary pressed')}
            />
            <AppButtonV2
              label="Tertiary"
              variant="tertiary"
              onPress={() => Alert.alert('Tertiary pressed')}
            />
          </View>
        </View>

        {/* Status Buttons */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Status Variants
          </MonoText>
          <View style={row(3, 'center')}>
            <AppButtonV2
              label="Success"
              variant="success"
              onPress={() => Alert.alert('Success')}
            />
            <AppButtonV2
              label="Destructive"
              variant="destructive"
              onPress={() => Alert.alert('Destructive')}
            />
            <AppButtonV2
              label="Soft"
              variant="soft"
              onPress={() => Alert.alert('Soft')}
            />
          </View>
        </View>

        {/* Sizes */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Sizes
          </MonoText>
          <View style={row(3, 'center')}>
            <AppButtonV2
              label="Small"
              size="sm"
              onPress={() => Alert.alert('Small')}
            />
            <AppButtonV2
              label="Medium"
              size="md"
              onPress={() => Alert.alert('Medium')}
            />
            <AppButtonV2
              label="Large"
              size="lg"
              onPress={() => Alert.alert('Large')}
            />
          </View>
        </View>

        {/* With Icons */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            With Icons
          </MonoText>
          <View style={row(3, 'center')}>
            <AppButtonV2
              label="Left Icon"
              iconLeft="Plus"
              onPress={() => Alert.alert('Left icon')}
            />
            <AppButtonV2
              label="Right Icon"
              iconRight="ArrowRight"
              onPress={() => Alert.alert('Right icon')}
            />
            <AppButtonV2
              variant="icon"
              iconLeft="Settings"
              onPress={() => Alert.alert('Icon only')}
            />
          </View>
        </View>

        {/* States */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            States
          </MonoText>
          <View style={row(3, 'center')}>
            <AppButtonV2 label="Loading" loading />
            <AppButtonV2 label="Disabled" disabled />
            <AppButtonV2 label="Ghost" variant="ghost" />
          </View>
        </View>

        {/* Full Width */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Full Width
          </MonoText>
          <AppButtonV2
            label="Full Width Button"
            variant="primary"
            fullWidth
            onPress={() => Alert.alert('Full width')}
          />
        </View>
      </View>

      {/* Cards Section */}
      <View style={styles.section}>
        <MonoText variant="h2" weight="semibold" style={styles.sectionTitle}>
          Cards
        </MonoText>

        {/* Elevation Levels */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Elevation Levels
          </MonoText>
          <View style={gap(4)}>
            <AppCardV2 elevation="flat">
              <MonoText variant="bodyEmphasis" weight="semibold">
                Flat Card
              </MonoText>
              <MonoText variant="caption" tone="muted">
                Level 0 - Border only, no shadow
              </MonoText>
            </AppCardV2>

            <AppCardV2 elevation="subtle">
              <MonoText variant="bodyEmphasis" weight="semibold">
                Subtle Card
              </MonoText>
              <MonoText variant="caption" tone="muted">
                Level 1 - Subtle shadow
              </MonoText>
            </AppCardV2>

            <AppCardV2 elevation="elevated">
              <MonoText variant="bodyEmphasis" weight="semibold">
                Elevated Card
              </MonoText>
              <MonoText variant="caption" tone="muted">
                Level 2 - Standard elevation
              </MonoText>
            </AppCardV2>

            <AppCardV2 elevation="floating">
              <MonoText variant="bodyEmphasis" weight="semibold">
                Floating Card
              </MonoText>
              <MonoText variant="caption" tone="muted">
                Level 3 - Maximum elevation
              </MonoText>
            </AppCardV2>
          </View>
        </View>

        {/* Preset Cards */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Preset Cards
          </MonoText>
          <View style={gap(4)}>
            <CompactCard>
              <MonoText variant="body">Compact Card - Smaller padding</MonoText>
            </CompactCard>

            <StandardCard>
              <MonoText variant="body">Standard Card - Default spacing</MonoText>
            </StandardCard>

            <HeroCard>
              <MonoText variant="h3" weight="semibold">
                Hero Card
              </MonoText>
              <MonoText variant="body" tone="muted">
                Large, prominent card for key content
              </MonoText>
            </HeroCard>
          </View>
        </View>

        {/* Interactive Card */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Interactive Card
          </MonoText>
          <AppCardV2
            elevation="subtle"
            onPress={() => Alert.alert('Card pressed!')}
          >
            <View style={row(3, 'center')}>
              <MonoText variant="bodyEmphasis" weight="semibold" style={{ flex: 1 }}>
                Tap this card
              </MonoText>
              <MonoText variant="caption" tone="muted">
                →
              </MonoText>
            </View>
          </AppCardV2>
        </View>

        {/* Card with Header and Footer */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Card with Sections
          </MonoText>
          <AppCardV2
            elevation="elevated"
            header={
              <View style={row(3, 'center')}>
                <MonoText variant="h3" weight="semibold" style={{ flex: 1 }}>
                  Order #1234
                </MonoText>
                <MonoText variant="caption" tone="muted">
                  In Progress
                </MonoText>
              </View>
            }
            footer={
              <AppButtonV2
                label="View Details"
                variant="soft"
                fullWidth
                onPress={() => Alert.alert('View details')}
              />
            }
          >
            <MonoText variant="body" tone="muted">
              Card content with header and footer sections
            </MonoText>
          </AppCardV2>
        </View>
      </View>

      {/* Inputs Section */}
      <View style={styles.section}>
        <MonoText variant="h2" weight="semibold" style={styles.sectionTitle}>
          Input Fields
        </MonoText>

        {/* Basic Inputs */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Basic Inputs
          </MonoText>
          <AppInputV2
            label="Email Address"
            placeholder="Enter your email"
            value={emailValue}
            onChangeText={setEmailValue}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInputV2
            label="Full Name"
            placeholder="John Doe"
            required
          />

          <AppInputV2
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            helperText="We'll never share your phone number"
          />
        </View>

        {/* Validation States */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Validation States
          </MonoText>
          <AppInputV2
            label="Success State"
            value="john@example.com"
            validation="success"
            successText="Email is available"
            iconRight="CheckCircle"
          />

          <AppInputV2
            label="Error State"
            value="invalid-email"
            validation="error"
            error="Please enter a valid email address"
            iconRight="AlertCircle"
          />

          <AppInputV2
            label="Warning State"
            value="password123"
            validation="warning"
            helperText="Consider using a stronger password"
            iconRight="AlertTriangle"
          />
        </View>

        {/* With Icons */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            With Icons
          </MonoText>
          <AppInputV2
            label="Search"
            placeholder="Search for anything..."
            iconLeft="MagnifyingGlass"
          />

          <AppInputV2
            label="Username"
            placeholder="@username"
            iconLeft="At"
          />
        </View>

        {/* Specialized Inputs */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Specialized Inputs
          </MonoText>
          <SearchInputV2
            label="Search Input"
            placeholder="Type to search..."
            value={searchValue}
            onChangeText={setSearchValue}
          />

          <PasswordInputV2
            label="Password"
            placeholder="Enter your password"
            value={passwordValue}
            onChangeText={setPasswordValue}
          />
        </View>

        {/* Input Sizes */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Sizes
          </MonoText>
          <AppInputV2
            label="Small Input"
            placeholder="Small size"
            size="sm"
          />

          <AppInputV2
            label="Medium Input (Default)"
            placeholder="Medium size"
            size="md"
          />

          <AppInputV2
            label="Large Input"
            placeholder="Large size"
            size="lg"
          />
        </View>

        {/* Disabled State */}
        <View style={styles.subsection}>
          <MonoText variant="caption" tone="muted" style={styles.subsectionTitle}>
            Disabled State
          </MonoText>
          <AppInputV2
            label="Disabled Input"
            value="Cannot edit this"
            editable={false}
          />
        </View>
      </View>

      {/* Typography Preview */}
      <View style={styles.section}>
        <MonoText variant="h2" weight="semibold" style={styles.sectionTitle}>
          Typography Scale
        </MonoText>
        <View style={gap(3)}>
          <MonoText variant="display" weight="bold">
            Display Text (32px)
          </MonoText>
          <MonoText variant="h1" weight="semibold">
            Heading 1 (24px)
          </MonoText>
          <MonoText variant="h2" weight="semibold">
            Heading 2 (20px)
          </MonoText>
          <MonoText variant="h3" weight="semibold">
            Heading 3 (17px)
          </MonoText>
          <MonoText variant="body">
            Body text (15px) - The quick brown fox jumps over the lazy dog
          </MonoText>
          <MonoText variant="caption">
            Caption text (13px) - Additional information
          </MonoText>
          <MonoText variant="footnote">
            Footnote (11px) - Fine print
          </MonoText>
        </View>
      </View>

      {/* Color Palette */}
      <View style={styles.section}>
        <MonoText variant="h2" weight="semibold" style={styles.sectionTitle}>
          Color Palette
        </MonoText>
        <View style={gap(3)}>
          <ColorSwatch label="Primary" color={getColor('primary', mode)} />
          <ColorSwatch label="Success" color={getColor('success', mode)} />
          <ColorSwatch label="Warning" color={getColor('warning', mode)} />
          <ColorSwatch label="Error" color={getColor('error', mode)} />
        </View>
      </View>

      {/* Spacing at bottom */}
      <View style={{ height: tokens.spacing[20] }} />
    </ScrollView>
  );
}

// Helper component for color swatches
function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <View style={row(3, 'center')}>
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: color,
          borderRadius: tokens.radius.md,
        }}
      />
      <MonoText variant="body" weight="medium">
        {label}
      </MonoText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[5],
  },
  section: {
    marginBottom: tokens.spacing[10],
  },
  sectionTitle: {
    marginBottom: tokens.spacing[5],
  },
  subsection: {
    marginBottom: tokens.spacing[6],
  },
  subsectionTitle: {
    marginBottom: tokens.spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
