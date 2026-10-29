import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Card,
  ExpiryMeter,
  MonthlyBars,
  SplitBar,
  StatTile,
  StatusLabel,
} from '@/components/dashboard/charts';
import { CarSwitcher } from '@/components/garage/car-switcher';
import { formatCost } from '@/components/services/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/form';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { garageActions, useGarage, type Car } from '@/lib/garage';
import {
  getExpiries,
  getLastService,
  getLatestMileage,
  getMissingEssentials,
  getMonthlySpending,
  getSpendingSummary,
} from '@/lib/insights';
import { STATUS_COLORS, getExpiryStatus, statusIcon } from '@/lib/status';

function describeCar(car: Car) {
  return [car.make, car.model, car.year].filter(Boolean).join(' ');
}

function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

export default function DashboardScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const garage = useGarage();
  const car = garage.activeCar;

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Glovebox</ThemedText>
          <ThemedText themeColor="textSecondary">
            {car
              ? 'Everything about your car at a glance.'
              : 'Add your first car to start tracking its documents and services.'}
          </ThemedText>
        </ThemedView>

        <CarSwitcher />

        {car && <CarDashboard key={car.id} car={car} />}
        {garage.cars.length > 1 && <Fleet />}
      </ThemedView>
    </ScrollView>
  );
}

function CarDashboard({ car }: { car: Car }) {
  const garage = useGarage();
  const documents = garage.documents.filter((d) => d.carId === car.id);
  const interventions = garage.interventions.filter((i) => i.carId === car.id);

  const expiries = getExpiries(documents);
  const missing = getMissingEssentials(documents);
  const spending = getSpendingSummary(interventions);
  const lastService = getLastService(interventions);
  const mileage = getLatestMileage(interventions);
  const fileCount =
    documents.reduce((n, d) => n + d.files.length, 0) +
    interventions.reduce((n, i) => n + i.bills.length, 0);
  const next = expiries[0];

  return (
    <>
      <CarHeader car={car} />

      <Card>
        {next ? (
          <View style={styles.hero}>
            <ThemedText type="small" themeColor="textSecondary">
              {next.days < 0 ? 'Needs renewing' : 'Next expiry'}
            </ThemedText>
            <View style={styles.heroRow}>
              <ThemedText type="title">{Math.abs(next.days)}</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {next.days < 0 ? 'days overdue' : next.days === 1 ? 'day left' : 'days left'}
              </ThemedText>
            </View>
            <View style={styles.heroFooter}>
              <SymbolView
                name={getExpiryStatus(next.days).icon}
                tintColor={getExpiryStatus(next.days).color}
                size={16}
              />
              <ThemedText type="smallBold" style={styles.flex}>
                {next.title}
              </ThemedText>
            </View>
          </View>
        ) : (
          <EmptyHint
            text="No expiry dates yet. Add the insurance and vignette to see how long they're valid."
            href="/documents"
            action="Add documents"
          />
        )}
      </Card>

      {missing.length > 0 && (
        <Card>
          {missing.map((m) => (
            <View key={m.kind} style={styles.alert}>
              <SymbolView
                name={statusIcon('critical')}
                tintColor={STATUS_COLORS.critical}
                size={16}
              />
              <ThemedText type="small" style={styles.flex}>
                {m.hasExpired
                  ? `No valid ${m.label.toLowerCase()}`
                  : `No ${m.label.toLowerCase()} added`}
              </ThemedText>
              <Link href="/documents" asChild>
                <Pressable>
                  <ThemedText type="linkPrimary">Add</ThemedText>
                </Pressable>
              </Link>
            </View>
          ))}
        </Card>
      )}

      {expiries.length > 0 && (
        <Card title="Validity">
          {expiries.map((e) => (
            <ExpiryMeter
              key={e.document.id}
              title={e.title}
              days={e.days}
              expiryDate={e.document.expiryDate!}
              totalDays={e.totalDays}
            />
          ))}
        </Card>
      )}

      <View style={styles.tiles}>
        <StatTile
          label="Spent this year"
          value={formatCost(spending.thisYear)}
          caption={`${formatCost(spending.total)} in total`}
        />
        <StatTile
          label="Last service"
          value={
            lastService?.daysAgo == null
              ? '—'
              : lastService.daysAgo === 0
                ? 'Today'
                : `${plural(lastService.daysAgo, 'day')} ago`
          }
          caption={lastService ? lastService.intervention.title : 'No service logged yet'}
        />
        <StatTile
          label="Mileage"
          value={mileage === null ? '—' : `${mileage.toLocaleString()} km`}
          caption="Latest recorded"
        />
        <StatTile
          label="On file"
          value={plural(documents.length, 'document')}
          caption={`${plural(fileCount, 'attachment')} · ${plural(interventions.length, 'intervention')}`}
        />
      </View>

      <Card title="Spending, last 12 months">
        {interventions.length > 0 ? (
          <>
            <MonthlyBars data={getMonthlySpending(interventions)} format={formatCost} />
            <SplitBar
              parts={[
                { label: 'Services', value: spending.services },
                { label: 'Repairs', value: spending.repairs },
              ]}
              format={formatCost}
            />
          </>
        ) : (
          <EmptyHint
            text="Log services and repairs to see where the money goes."
            href="/services"
            action="Add a service"
          />
        )}
      </Card>
    </>
  );
}

function CarHeader({ car }: { car: Car }) {
  const [confirming, setConfirming] = useState(false);
  const description = describeCar(car);

  return (
    <View style={styles.carHeader}>
      <View style={styles.carHeaderRow}>
        <View style={styles.flex}>
          <ThemedView type="text" style={styles.plate}>
            <ThemedText type="smallBold" themeColor="background" style={styles.plateText}>
              {car.plate}
            </ThemedText>
          </ThemedView>
          {description ? (
            <ThemedText type="small" themeColor="textSecondary">
              {description}
            </ThemedText>
          ) : null}
        </View>
        {!confirming && (
          <Chip label="Remove car" selected={false} onPress={() => setConfirming(true)} />
        )}
      </View>
      {confirming && (
        <Card>
          <ThemedText type="small">
            Remove {car.plate} with all its documents, services, files and reminders? This can’t
            be undone.
          </ThemedText>
          <View style={styles.confirmRow}>
            <Chip label="Cancel" selected={false} onPress={() => setConfirming(false)} />
            <Chip
              label={`Remove ${car.plate}`}
              selected
              onPress={() => garageActions.removeCar(car.id)}
            />
          </View>
        </Card>
      )}
    </View>
  );
}

function Fleet() {
  const garage = useGarage();

  return (
    <Card title="All cars">
      {garage.cars.map((car) => {
        const next = getExpiries(garage.documents.filter((d) => d.carId === car.id))[0];
        const isActive = car.id === garage.activeCar?.id;
        return (
          <Pressable
            key={car.id}
            onPress={() => garageActions.selectCar(car.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [styles.fleetRow, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <ThemedText type={isActive ? 'smallBold' : 'small'}>{car.plate}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {next ? next.title : 'No expiry dates'}
              </ThemedText>
            </View>
            {next && <StatusLabel days={next.days} />}
          </Pressable>
        );
      })}
    </Card>
  );
}

function EmptyHint({
  text,
  href,
  action,
}: {
  text: string;
  href: '/documents' | '/services';
  action: string;
}) {
  return (
    <View style={styles.emptyHint}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
      <Link href={href} asChild>
        <Pressable>
          <ThemedText type="linkPrimary">{action} →</ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  carHeader: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  carHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  plate: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    marginBottom: Spacing.one,
  },
  plateText: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 1,
  },
  confirmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  hero: {
    gap: Spacing.one,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  emptyHint: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
