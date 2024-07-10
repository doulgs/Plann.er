import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Check, Clock, Calendar as IconCalendar, PlusIcon, Tag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Keyboard, SectionList, Text, View } from "react-native";
import { TripData } from "./[id]";
import { Calendar } from "@/components/calendar";
import { activitiesServer } from "@/server/activities-server";
import { Activity, ActivityProps } from "@/components/activity";
import Loading from "@/components/loading";

type Props = {
  tripDetails: TripData;
};

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  NEW_ACTIVITY = 2,
}

type TripActivities = {
  title: {
    dayNumber: number;
    dayName: string;
  };
  data: ActivityProps[];
};

export function Activities({ tripDetails }: Props) {
  //MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  //LOADING
  const [isCreateActivity, setIsCreateActivity] = useState<boolean>(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(true);

  // DATA
  const [activityTitle, setActivityTitle] = useState<string>("");
  const [activityDate, setActivityDate] = useState<string>("");
  const [activityHour, setActivityHour] = useState<string>("");

  //LIST
  const [tripActivities, setTripActivities] = useState<TripActivities[]>([]);

  function ressetNewActivity() {
    setActivityTitle("");
    setActivityDate("");
    setActivityHour("");
    setShowModal(MODAL.NONE);
  }

  async function handleCreateTripActivity() {
    try {
      if (!activityTitle || !activityDate || !activityHour) {
        return Alert.alert("Atividade", "Preencha todas as informaçãoes da atividade para seguir!");
      }

      setIsCreateActivity(true);

      await activitiesServer.create({
        tripId: tripDetails.id,
        occurs_at: dayjs(activityDate).add(Number(activityHour), "h").toString(),
        title: activityTitle,
      });

      Alert.alert("Atividade", "Nova atividade cadastrada com sucesso!");

      await getTripActivities();

      ressetNewActivity();
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreateActivity(false);
    }
  }

  async function getTripActivities() {
    try {
      const activities = await activitiesServer.getActivitiesByTripId(tripDetails.id);

      const activitiesToSectionList = activities.map((dayActivity) => ({
        title: {
          dayNumber: dayjs(dayActivity.date).date(),
          dayName: dayjs(dayActivity.date).format("dddd").replace("-feira", ""),
        },
        data: dayActivity.activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          hour: dayjs(activity.occurs_at).format("hh[:]mm[h]"),
          isBefore: dayjs(activity.occurs_at).isBefore(dayjs()),
        })),
      }));

      setTripActivities(activitiesToSectionList);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingActivity(false);
    }
  }

  useEffect(() => {
    getTripActivities();
  }, []);

  return (
    <View className="flex-1">
      <View className="w-full flex-row mt-5 mb-6 items-center">
        <Text className="text-zinc-50 text-2xl font-semibold flex-1">Atividades</Text>

        <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
          <PlusIcon color={colors.lime[950]} />
          <Button.Title>Nova atividade</Button.Title>
        </Button>
      </View>

      {isLoadingActivity ? (
        <Loading />
      ) : (
        <SectionList
          sections={tripActivities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Activity data={item} />}
          renderSectionHeader={({ section }) => (
            <View className="w-full">
              <Text className="text-zinc-50 text-2xl font-semibold py-2">
                {`Dia ${section.title.dayNumber + " "}`}
                <Text className="text-zinc-400 text-sm capitalize">{`${section.title.dayName}`}</Text>
              </Text>

              {section.data.length === 0 && (
                <Text className="text-zinc-500 font-regular text-sm mb-8">
                  Nenhuma atividade cadastrada nessa data.
                </Text>
              )}
            </View>
          )}
          contentContainerClassName="gap-2 pb-48"
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        title="Cadastrar atividade"
        subtitle="Todos os convidados podem visializar as atividades"
        visible={showModal === MODAL.NEW_ACTIVITY}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="mt-4 mb-3">
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} />
            <Input.Field
              placeholder="Qual o nome da atividade ?"
              value={activityTitle}
              onChangeText={setActivityTitle}
            />
          </Input>

          <View className="w-full mt-2 flex-row gap-2">
            <Input className="flex-1" variant="secondary">
              <IconCalendar color={colors.zinc[400]} />
              <Input.Field
                placeholder="Data"
                value={activityDate ? dayjs(activityDate).format("DD [de] MMMM") : ""}
                onChangeText={setActivityTitle}
                onFocus={() => Keyboard.dismiss()}
                showSoftInputOnFocus={false}
                onPressIn={() => setShowModal(MODAL.CALENDAR)}
              />
            </Input>

            <Input className="flex-1" variant="secondary">
              <Clock color={colors.zinc[400]} />
              <Input.Field
                placeholder="Horário"
                value={activityHour}
                onChangeText={(text) => setActivityHour(text.replace(".", "").replace(",", ""))}
                keyboardType="numeric"
                maxLength={2}
              />
            </Input>
          </View>
        </View>
        <Button className="" onPress={handleCreateTripActivity} isLoading={isCreateActivity}>
          <Button.Title>Cadastrar atividade</Button.Title>
        </Button>
      </Modal>

      <Modal
        title="Selecionar data"
        subtitle="Selecione a data da atividade"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={(day) => setActivityDate(day.dateString)}
            markedDates={{ [activityDate]: { selected: true } }}
            initialDate={tripDetails.starts_at.toString()}
            minDate={tripDetails.starts_at.toString()}
            maxDate={tripDetails.ends_at.toString()}
          />
          <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
            <Check color={colors.lime[950]} />
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
