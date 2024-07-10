import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { Input } from "@/components/input";
import Loading from "@/components/loading";
import { Modal } from "@/components/modal";
import { TripDetails, tripServer } from "@/server/trip-server";
import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarRange, Calendar as IconCalendar, Info, Mail, MapPin, Settings2, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Keyboard, Pressable, Text, TouchableOpacity, View } from "react-native";
import { DateData } from "react-native-calendars";
import { Activities } from "./activities";
import { Details } from "./details";
import { GuestEmail } from "@/components/email";
import { validateInput } from "@/utils/validateInput";
import { participantsServer } from "@/server/participants-server";
import { tripStorage } from "@/storage/trip";

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  UPDATE_TRIP = 2,
  CONFIRM_ATTENDANCE = 3,
}

export type TripData = TripDetails & { when: string };
export default function Trip() {
  // LOADING
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [isConfirminAttendance, setIsConfirminAttendance] = useState(false);

  // MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  // DATA
  const [tripDetails, settripDetails] = useState({} as TripData);
  const [options, setOptions] = useState<"activity" | "details">("activity");
  const [destination, setDestination] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);

  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");

  const tripParams = useLocalSearchParams<{ id: string; participant?: string }>();

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true);

      if (tripParams.participant) {
        setShowModal(MODAL.CONFIRM_ATTENDANCE);
      }

      if (!tripParams.id) {
        return router.back();
      }

      const trip = await tripServer.getById(tripParams.id);

      const maxLengthDestination = 14;
      const destination =
        trip.destination.length > maxLengthDestination
          ? trip.destination.slice(0, maxLengthDestination) + "..."
          : trip.destination;

      const start_at = dayjs(trip.starts_at).format("DD");
      const ends_at = dayjs(trip.ends_at).format("DD");
      const month = dayjs(trip.starts_at).format("MMMM");

      setDestination(trip.destination);

      settripDetails({
        ...trip,
        when: `${destination} de ${start_at} a ${ends_at} de ${month}.`,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTrip(false);
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);
  }

  async function handleUpdateTrip() {
    try {
      if (!tripParams.id) return;

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        Alert.alert("Atualizar viagem", "Lembre-se de preencher o destino e as datas de inicio e fim da viagem.");
      }

      setIsUpdatingTrip(true);

      await tripServer.update({
        id: tripParams.id,
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
      });

      Alert.alert("Atualização da viagem", "Dados da viagem atualizados com sucesso.", [
        {
          text: "OK",
          onPress: () => {
            setShowModal(MODAL.NONE);
            getTripDetails;
          },
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingTrip(true);
    }
  }

  async function handleConfirmAttendance() {
    try {
      if (!tripParams.id || !tripParams.participant) {
        return;
      }

      if (!guestName.trim() || guestEmail.trim()) {
        return Alert.alert("Confirmação", "Preencha nome e e-mail para a confirmar a viagem.");
      }

      if (!validateInput.email(guestEmail.trim())) {
        return Alert.alert("Confirmação", "E-mail informado é invalido!");
      }

      setIsConfirminAttendance(true);

      await participantsServer.confirmTripByParticipantId({
        participantId: tripParams.participant,
        name: guestName,
        email: guestEmail.trim(),
      });

      Alert.alert("Confirmação", "Sua participação esta confirmada com sucesso na viagem.");

      await tripStorage.save(tripParams.id);

      setShowModal(MODAL.NONE);
    } catch (error) {
      console.error(error);
      Alert.alert("Confirmar viagem", "Não foi possível realizar a confirmação da sua presença!");
    } finally {
      setIsConfirminAttendance(false);
    }
  }

  async function handleRemoveTrip() {
    try {
      Alert.alert("Abandonar viagem", "Tem certeza que deseja abandonar essa viagem?", [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim, tenho certeza",
          onPress: async () => {
            await tripStorage.remove();
            router.navigate("/");
          },
        },
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getTripDetails();
  }, []);

  if (isLoadingTrip) {
    return <Loading />;
  }
  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary" className="w-full">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />

        <TouchableOpacity
          activeOpacity={0.6}
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {options === "activity" ? <Activities tripDetails={tripDetails} /> : <Details tripId={tripDetails.id} />}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOptions("activity")}
            variant={options === "activity" ? "primary" : "secondary"}
          >
            <CalendarRange color={options === "activity" ? colors.lime[950] : colors.zinc[200]} size={20} />
            <Button.Title>Atividades</Button.Title>
          </Button>
          <Button
            className="flex-1"
            onPress={() => setOptions("details")}
            variant={options === "details" ? "primary" : "secondary"}
          >
            <Info color={options === "details" ? colors.lime[950] : colors.zinc[200]} size={20} />
            <Button.Title>Detalhes</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Atualizar viagem"
        subtitle="Somente quem criou a viagem pode editar"
        visible={showModal === MODAL.UPDATE_TRIP}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="Para onde?" value={destination} onChangeText={setDestination} />
          </Input>

          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Quando?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(MODAL.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
              showSoftInputOnFocus={false}
            />
          </Input>

          <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
            <Button.Title>Atualizar viagem</Button.Title>
          </Button>

          <Button variant="secondary" onPress={handleRemoveTrip}>
            <Button.Title>Sair da viagem</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar minDate={dayjs().toISOString()} onDayPress={handleSelectDate} markedDates={selectedDates.dates} />

          <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
            <Button.Title>Confirmar datas</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal title="Confirmar presença" visible={showModal === MODAL.CONFIRM_ATTENDANCE}>
        <View className="gap-4 mt-4">
          <Text className="text-zinc-400 font-regular leading-6 my-2">
            Voçe foi convidado(a) para participar de uma viagem para
            <Text className="font-semibold text-zinc-100"> {tripDetails.destination} </Text>
            nas datas de{" "}
            <Text className="font-semibold text-zinc-100">
              {dayjs(tripDetails.starts_at).date()} a {dayjs(tripDetails.ends_at).date()} de{" "}
              {dayjs(tripDetails.ends_at).format("MMMM")}. {"\n\n"}
            </Text>
            Para confirmar presença, preencha os dados abaixo.
          </Text>

          <Input variant="secondary">
            <User color={colors.zinc[400]} />
            <Input.Field placeholder="Seu nome completo" value={guestName} onChangeText={setGuestName} />
          </Input>

          <Input variant="secondary">
            <Mail color={colors.zinc[400]} />
            <Input.Field placeholder="E-mail de confirmação" value={guestEmail} onChangeText={setGuestEmail} />
          </Input>

          <Button isLoading={isConfirminAttendance} onPress={handleConfirmAttendance}>
            <Button.Title>Confirmar minha presença</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
