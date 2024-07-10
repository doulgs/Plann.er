import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { Participant, ParticipantProps } from "@/components/participant";
import { TripLink, TripLinkProps } from "@/components/tripLink";
import { linksServer } from "@/server/links-server";
import { participantsServer } from "@/server/participants-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Check, ClipboardList, Plus, Link } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

type Props = {
  tripId: string;
};

export function Details({ tripId }: Props) {
  //MODAL
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);

  //LOADING
  const [isCreateLinkTrip, setIsCreateLinkTrip] = useState(false);

  //LIST
  const [links, setLinks] = useState<TripLinkProps[]>([]);
  const [participants, setParticipants] = useState<ParticipantProps[]>([]);

  //DATA
  const [linkTitle, setlinkTitle] = useState<string>("");
  const [linkURL, setLinkURL] = useState<string>("");

  function resetNewLinkFields() {
    setlinkTitle("");
    setLinkURL("");
    setShowNewLinkModal(false);
  }

  async function handleCreateTripLink() {
    try {
      if (!linkTitle.trim()) {
        return Alert.alert("Link", "Informe um Titulo valido para o link!");
      }

      if (!validateInput.url(linkURL.trim())) {
        return Alert.alert("Link", "Link invalido!");
      }

      setIsCreateLinkTrip(true);

      await linksServer.create({
        tripId,
        title: linkTitle.trim(),
        url: linkURL.trim(),
      });

      Alert.alert("Link", "Link criado com sucesso!");
      resetNewLinkFields();

      await getTripLinks();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreateLinkTrip(false);
    }
  }

  async function getTripLinks() {
    try {
      const links = await linksServer.getLinksByTripId(tripId);
      setLinks(links);
    } catch (error) {
      console.error(error);
    }
  }

  async function getTripParticipants() {
    try {
      const participants = await participantsServer.getByTripId(tripId);
      setParticipants(participants);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getTripLinks();
    getTripParticipants();
  }, []);

  return (
    <View className="flex-1 mt-10">
      <Text className="text-zinc-50 text-2xl mb-2 font-semibold">Link`s importantes</Text>

      <View className="flex-1 ">
        {links.length > 0 ? (
          <FlatList
            data={links}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripLink data={item} />}
            contentContainerClassName="gap-4"
          />
        ) : (
          <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">Nenhum link cadastrado por enquanto.</Text>
        )}

        <Button variant="secondary" onPress={() => setShowNewLinkModal(true)}>
          <Plus color={colors.zinc[200]} size={20} />
          <Button.Title>Cadastrar novo link</Button.Title>
        </Button>
      </View>

      <View className="flex-1 border-t border-zinc-800 mt-6">
        <Text className="text-zinc-50 text-2xl my-6 font-semibold">Convidados</Text>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Participant data={item} />}
          contentContainerClassName="gap-4 pb-44"
        />
      </View>

      <Modal
        title="Cadastrar Link"
        subtitle="Todos os convidados podem visualizar os link`s importantes"
        visible={showNewLinkModal}
        onClose={() => setShowNewLinkModal(false)}
      >
        <View className="gap-3 mb-3">
          <Input variant="secondary">
            <ClipboardList color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="Titulo do link" onChangeText={setlinkTitle} />
          </Input>
          <Input variant="secondary">
            <Link color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="URL" onChangeText={setLinkURL} />
          </Input>

          <Button isLoading={isCreateLinkTrip} onPress={handleCreateTripLink}>
            <Button.Title>Adicionar link</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
