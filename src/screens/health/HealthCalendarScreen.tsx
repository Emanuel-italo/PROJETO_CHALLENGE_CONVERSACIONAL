// HealthCalendarScreen.tsx

import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";
import { styles } from "../../styles/HealthCalendarScreen.styles";

import { usePets } from "../../hooks/usePets";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CalendarEvent = {
  id: string;
  petName: string;
  petId: string;
  type: "vaccine" | "medication";
  name: string;
  date: string;
  done: boolean;
  color: string;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MAX_DOTS_PER_DAY = 3;

export default function HealthCalendarScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Esta tela é usada tanto como aba (rota "Calendar", que já tem
  // o header global do MainTabs) quanto empilhada a partir do Dashboard
  // (rota "HealthCalendar", sem header nativo) — só renderiza header
  // próprio nesse segundo caso, evitando o título/faixa duplicados.
  const showOwnHeader = route.name !== "Calendar";

  const { pets, loading, error, reload } = usePets();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate(),
  );

  const isCurrentMonth =
    selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

  const events = useMemo<CalendarEvent[]>(() => {
    const allEvents: CalendarEvent[] = [];

    pets.forEach((pet) => {
      (pet.vaccines ?? []).forEach((v) => {
        if (v.date) {
          allEvents.push({
            id: `vac-${v.id}`,
            petName: pet.name,
            petId: pet.id,
            type: "vaccine",
            name: v.name,
            date: v.date,
            done: v.done,
            color: Colors.accentGreen,
          });
        }

        if (v.nextDue) {
          allEvents.push({
            id: `vac-next-${v.id}`,
            petName: pet.name,
            petId: pet.id,
            type: "vaccine",
            name: `${v.name} - Próxima dose`,
            date: v.nextDue,
            done: false,
            color: Colors.accentOrange,
          });
        }
      });

      (pet.medications ?? []).forEach((m) => {
        if (m.startDate) {
          allEvents.push({
            id: `med-${m.id}`,
            petName: pet.name,
            petId: pet.id,
            type: "medication",
            name: m.name,
            date: m.startDate,
            done: !m.active,
            color: Colors.accentLight,
          });
        }
      });
    });

    return allEvents;
  }, [pets]);

  const onRefresh = async () => {
    setRefreshing(true);

    await reload();

    setRefreshing(false);
  };

  const goToPreviousMonth = () => {
    setSelectedDay(null);

    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsByDay = (day: number) => {
    return events.filter((event) => {
      const parts = event.date.split("/");

      if (parts.length !== 3) return false;

      const eventDay = parseInt(parts[0]);
      const eventMonth = parseInt(parts[1]) - 1;
      const eventYear = parseInt(parts[2]);

      return (
        eventDay === day &&
        eventMonth === selectedMonth &&
        eventYear === selectedYear
      );
    });
  };

  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);

  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDayEvents = selectedDay ? getEventsByDay(selectedDay) : [];

  const selectedDayLabel = selectedDay
    ? new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString(
        "pt-BR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      )
    : "";

  return (
    <View style={styles.container}>
      {showOwnHeader && (
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Calendário</Text>

          <View style={styles.headerSpace} />
        </View>
      )}

      {loading && pets.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={Colors.accentLight} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accentLight}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error && <Text style={styles.emptyText}>{error}</Text>}

          <View style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={goToPreviousMonth}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
              </TouchableOpacity>

              <Text style={styles.monthText}>{monthName}</Text>

              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={goToNextMonth}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {DAYS.map((day) => (
                <View key={day} style={styles.weekTextWrapper}>
                  <Text style={styles.weekText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsByDay(day) : [];

                const isToday = isCurrentMonth && day === today.getDate();

                const isSelected = day !== null && day === selectedDay;

                return (
                  <View key={index} style={styles.dayCellWrapper}>
                    {day && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.dayCell,
                          isToday && styles.dayCellToday,
                          isSelected && styles.dayCellSelected,
                        ]}
                        onPress={() => setSelectedDay(isSelected ? null : day)}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            isSelected && styles.dayNumberSelected,
                          ]}
                        >
                          {day}
                        </Text>

                        {dayEvents.length > 0 && (
                          <View style={styles.dotsRow}>
                            {dayEvents
                              .slice(0, MAX_DOTS_PER_DAY)
                              .map((event) => (
                                <View
                                  key={event.id}
                                  style={[
                                    styles.dot,
                                    {
                                      backgroundColor: isSelected
                                        ? Colors.primary
                                        : event.done
                                          ? Colors.accentGreen
                                          : Colors.accentOrange,
                                    },
                                  ]}
                                />
                              ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendRow}>
                <View style={styles.legendRing} />

                <Text style={styles.legendText}>Hoje</Text>
              </View>

              <View style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.accentGreen },
                  ]}
                />

                <Text style={styles.legendText}>Concluído</Text>
              </View>

              <View style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.accentOrange },
                  ]}
                />

                <Text style={styles.legendText}>Pendente</Text>
              </View>
            </View>
          </View>

          {selectedDay && (
            <View style={styles.dayDetailCard}>
              <Text style={styles.dayDetailTitle}>{selectedDayLabel}</Text>

              {selectedDayEvents.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nenhum compromisso neste dia
                </Text>
              ) : (
                selectedDayEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.pendingCard}
                    onPress={() =>
                      navigation.navigate("PetDetail", { petId: event.petId })
                    }
                  >
                    <View
                      style={[
                        styles.pendingIcon,
                        {
                          backgroundColor: event.color + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          event.type === "vaccine"
                            ? "shield-checkmark"
                            : "medical"
                        }
                        size={18}
                        color={event.color}
                      />
                    </View>

                    <View style={styles.flexOne}>
                      <Text style={styles.pendingName}>{event.name}</Text>

                      <Text style={styles.pendingPet}>🐾 {event.petName}</Text>
                    </View>

                    <Ionicons
                      name={event.done ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={
                        event.done ? Colors.accentGreen : Colors.accentOrange
                      }
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={styles.pendingContainer}>
            <Text style={styles.pendingTitle}>Pendências cadastradas</Text>

            {events.filter((e) => !e.done).length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma pendência encontrada</Text>
            ) : (
              events
                .filter((e) => !e.done)
                .map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.pendingCard}
                    onPress={() =>
                      navigation.navigate("PetDetail", {
                        petId: event.petId,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.pendingIcon,
                        {
                          backgroundColor: event.color + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          event.type === "vaccine"
                            ? "shield-checkmark"
                            : "medical"
                        }
                        size={18}
                        color={event.color}
                      />
                    </View>

                    <View style={styles.flexOne}>
                      <Text style={styles.pendingName}>{event.name}</Text>

                      <Text style={styles.pendingPet}>🐾 {event.petName}</Text>

                      <Text style={styles.pendingDate}>{event.date}</Text>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
