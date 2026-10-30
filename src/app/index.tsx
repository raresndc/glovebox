import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import {
  Card,
  ExpiryMeter,
  MonthlyBars,
  SplitBar,
  StatTile,
  StatusLabel,
} from '@/components/dashboard/charts';
import { DOCUMENT_KINDS } from '@/components/documents/types';
import { CarSwitcher } from '@/components/garage/car-switcher';
import { INTERVENTION_KINDS, formatCost } from '@/components/services/types';
import { ThemedText } from '@/components/themed-text';
import { SecondaryButton } from '@/components/ui/form';
import { IconBadge, Icons, type IconName } from '@/components/ui/icon';
import { Appear, PressableScale } from '@/components/ui/motion';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Gradients, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { garageActions, useGarage, type Car } from '@/lib/garage';
import {
  getExpiries,
  getLastService,
  getLatestMileage,
  getMissingEssentials,
  getMonthlySpending,
  getSpendingSummary,
  type Expiry,
} from '@/lib/insights';
import { STATUS_COLORS, getExpiryStatus, statusIcon } from '@/lib/status';

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255, 255, 255, 0.72)';

function describeCar(car: Car) {
  return [car.make, car.model, car.year].filter(Boolean).join(' ');
}

function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

export default function DashboardScreen() {
  const garage = useGarage();
  const car = garage.activeCar;

  return (
    <Screen
      title="Glovebox"
      subtitle={
        car
          ? 'Everything about your car at a glance.'
          : 'Add your first car to start tracking its documents and services.'
      }>
      <CarSwitcher />

      {car && <CarDashboard key={car.id} car={car} />}
      {garage.cars.length > 1 && (
        <Appear index={6}>
          <Fleet />
        </Appear>
      )}
    </Screen>
  );
}

function CarDashboard({ car }: { car: Car }) {
  const theme = useTheme();
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

  return (
    <>
      <Appear index={0}>
        <Hero car={car} next={expiries[0]} />
      </Appear>

      <Appear index={1} style={styles.actions}>
        <QuickAction
          href="/documents"
          label="Add document"
          icon={DOCUMENT_KINDS.insurance.icon}
          accent={DOCUMENT_KINDS.insurance.accent}
        />
        <QuickAction
          href="/services"
          label="Log service"
          icon={INTERVENTION_KINDS.repair.icon}
          accent={INTERVENTION_KINDS.repair.accent}
        />
      </Appear>

      {missing.length > 0 && (
        <Appear index={2}>
          <Card title="Missing documents" icon={statusIcon('critical')}>
            {missing.map((m) => (
              <View key={m.kind} style={[styles.alert, { backgroundColor: theme.background }]}>
                <SymbolView
                  name={statusIcon('critical')}
                  tintColor={STATUS_COLORS.critical}
                  size={18}
                />
                <ThemedText type="small" style={styles.flex}>
                  {m.hasExpired
                    ? `No valid ${m.label.toLowerCase()}`
                    : `No ${m.label.toLowerCase()} added`}
                </ThemedText>
                <Link href="/documents" asChild>
                  <PressableScale
                    style={StyleSheet.flatten([styles.alertAction, { backgroundColor: theme.tint }])}>
                    <ThemedText type="smallBold" themeColor="onTint">
                      Add
                    </ThemedText>
                  </PressableScale>
                </Link>
              </View>
            ))}
          </Card>
        </Appear>
      )}

      {expiries.length > 0 && (
        <Appear index={3}>
          <Card title="Validity" icon={Icons.timer}>
            {expiries.map((e, index) => (
              <ExpiryMeter
                key={e.document.id}
                index={index}
                title={e.title}
                days={e.days}
                expiryDate={e.document.expiryDate!}
                totalDays={e.totalDays}
                icon={DOCUMENT_KINDS[e.document.kind].icon}
                accent={DOCUMENT_KINDS[e.document.kind].accent}
              />
            ))}
          </Card>
        </Appear>
      )}

      <Appear index={4} style={styles.tiles}>
        <StatTile
          label="Spent this year"
          value={formatCost(spending.thisYear)}
          caption={`${formatCost(spending.total)} in total`}
          icon={Icons.wallet}
          accent="#16A394"
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
          icon={INTERVENTION_KINDS.service.icon}
          accent={INTERVENTION_KINDS.service.accent}
        />
        <StatTile
          label="Mileage"
          value={mileage === null ? '—' : `${mileage.toLocaleString()} km`}
          caption="Latest recorded"
          icon={Icons.gauge}
          accent="#8B5CF6"
        />
        <StatTile
          label="On file"
          value={plural(documents.length, 'document')}
          caption={`${plural(fileCount, 'attachment')} · ${plural(interventions.length, 'intervention')}`}
          icon={Icons.folder}
          accent="#EC4899"
        />
      </Appear>

      <Appear index={5}>
        <Card title="Spending, last 12 months" icon={Icons.chart}>
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
      </Appear>
    </>
  );
}

/** Romanian-style number plate: blue "RO" band, then the registration. */
function Plate({ plate }: { plate: string }) {
  return (
    <View style={styles.plate}>
      <View style={styles.plateBand}>
        <ThemedText style={styles.plateBandText}>RO</ThemedText>
      </View>
      <ThemedText style={styles.plateText}>{plate}</ThemedText>
    </View>
  );
}

function Hero({ car, next }: { car: Car; next?: Expiry }) {
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);
  const description = describeCar(car);
  const status = next ? getExpiryStatus(next.days) : null;

  return (
    <View style={styles.heroGroup}>
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View style={styles.heroCar}>
            <Plate plate={car.plate} />
            {description ? (
              <ThemedText type="small" style={{ color: ON_HERO_MUTED }}>
                {description}
              </ThemedText>
            ) : null}
          </View>
          <PressableScale
            onPress={() => setConfirming((c) => !c)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${car.plate}`}
            pressedScale={0.85}
            style={styles.heroButton}>
            <SymbolView name={Icons.trash} tintColor={ON_HERO} size={14} />
          </PressableScale>
        </View>

        {next && status ? (
          <View style={styles.heroBody}>
            <ThemedText type="small" style={{ color: ON_HERO_MUTED }}>
              {next.days < 0 ? 'Needs renewing' : 'Next expiry'}
            </ThemedText>
            <View style={styles.heroRow}>
              <ThemedText type="title" style={{ color: ON_HERO }}>
                {Math.abs(next.days)}
              </ThemedText>
              <ThemedText type="default" style={{ color: ON_HERO_MUTED }}>
                {next.days < 0 ? 'days overdue' : next.days === 1 ? 'day left' : 'days left'}
              </ThemedText>
            </View>
            <View style={styles.heroFooter}>
              <View style={styles.heroStatus}>
                <SymbolView name={status.icon} tintColor={status.color} size={14} />
                <ThemedText type="smallBold" style={styles.heroStatusText}>
                  {status.label}
                </ThemedText>
              </View>
              <ThemedText
                type="smallBold"
                style={[styles.flex, { color: ON_HERO }]}
                numberOfLines={1}>
                {next.title}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.heroBody}>
            <ThemedText type="default" style={{ color: ON_HERO }}>
              No expiry dates yet
            </ThemedText>
            <ThemedText type="small" style={{ color: ON_HERO_MUTED }}>
              Add the insurance and vignette to see how long they’re valid.
            </ThemedText>
          </View>
        )}
      </LinearGradient>

      {confirming && (
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOutUp.duration(150)}>
          <Surface>
            <ThemedText type="small">
              Remove {car.plate} with all its documents, services, files and reminders? This can’t
              be undone.
            </ThemedText>
            <View style={styles.confirmRow}>
              <View style={styles.flex}>
                <SecondaryButton label="Cancel" onPress={() => setConfirming(false)} />
              </View>
              <PressableScale
                onPress={() => garageActions.removeCar(car.id)}
                accessibilityRole="button"
                style={[styles.dangerButton, { backgroundColor: theme.danger }]}>
                <ThemedText type="smallBold" style={{ color: ON_HERO }}>
                  Remove {car.plate}
                </ThemedText>
              </PressableScale>
            </View>
          </Surface>
        </Animated.View>
      )}
    </View>
  );
}

function QuickAction({
  href,
  label,
  icon,
  accent,
}: {
  href: '/documents' | '/services';
  label: string;
  icon: IconName;
  accent: string;
}) {
  const theme = useTheme();
  return (
    <Link href={href} asChild>
      <PressableScale style={styles.action} accessibilityRole="link">
        <Surface style={styles.actionInner}>
          <View style={styles.actionTop}>
            <IconBadge name={icon} color={accent} size={36} />
            <SymbolView name={Icons.chevron} tintColor={theme.textSecondary} size={14} />
          </View>
          <ThemedText type="smallBold" numberOfLines={1}>
            {label}
          </ThemedText>
        </Surface>
      </PressableScale>
    </Link>
  );
}

function Fleet() {
  const theme = useTheme();
  const garage = useGarage();

  return (
    <Card title="All cars" icon={Icons.car}>
      {garage.cars.map((car) => {
        const next = getExpiries(garage.documents.filter((d) => d.carId === car.id))[0];
        const isActive = car.id === garage.activeCar?.id;
        return (
          <PressableScale
            key={car.id}
            onPress={() => garageActions.selectCar(car.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            pressedScale={0.98}
            style={[
              styles.fleetRow,
              {
                backgroundColor: theme.background,
                borderColor: isActive ? theme.tint : 'transparent',
              },
            ]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{car.plate}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {next ? next.title : 'No expiry dates'}
              </ThemedText>
            </View>
            {next && <StatusLabel days={next.days} />}
          </PressableScale>
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
        <PressableScale style={styles.emptyLink}>
          <ThemedText type="linkPrimary">{action} →</ThemedText>
        </PressableScale>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  heroGroup: {
    gap: Spacing.three,
  },
  hero: {
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.large + 4,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(27, 42, 78, 0.35)',
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  heroCar: {
    flex: 1,
    gap: Spacing.two,
  },
  heroButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroBody: {
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
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  heroStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  heroStatusText: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
  },
  plate: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0F172A',
    overflow: 'hidden',
  },
  plateBand: {
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.one + Spacing.half,
    paddingBottom: Spacing.half,
    backgroundColor: '#003399',
  },
  plateBandText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: 700,
  },
  plateText: {
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 800,
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.two + Spacing.one,
  },
  confirmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dangerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    flex: 1,
  },
  actionInner: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  actionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  alertAction: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
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
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
  },
  emptyHint: {
    gap: Spacing.one,
  },
  emptyLink: {
    alignSelf: 'flex-start',
  },
});
