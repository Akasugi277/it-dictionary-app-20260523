import { Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { AppTextInput } from "../components/AppTextInput";
import { styles } from "../styles";
import { Term } from "../types";

type QuizScreenProps = {
  quizTerm: Term;
  quizAnswer: string;
  quizFeedback: string;
  quizScore: number | null;
  onChangeAnswer: (value: string) => void;
  onGradeQuiz: () => void;
  onNextQuiz: () => void;
  onAutoReview: () => void;
};

export function QuizScreen({
  quizTerm,
  quizAnswer,
  quizFeedback,
  quizScore,
  onChangeAnswer,
  onGradeQuiz,
  onNextQuiz,
  onAutoReview,
}: QuizScreenProps) {
  return (
    <>
      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>クイズ: 自分の言葉で説明</AppText>
        <AppText style={styles.bodyText}>
          「{quizTerm.term}」を説明してください。ヒント: {quizTerm.keywords.join("、")}
        </AppText>

        <AppTextInput
          value={quizAnswer}
          onChangeText={onChangeAnswer}
          multiline
          style={styles.quizInput}
          placeholder="自分の言葉で書いてください"
          placeholderTextColor="#8ea1b5"
        />

        <View style={styles.rowButtons}>
          <Pressable style={styles.primaryButton} onPress={onGradeQuiz}>
            <AppText style={styles.primaryButtonText}>AI添削する</AppText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onNextQuiz}>
            <AppText style={styles.secondaryButtonText}>次の問題</AppText>
          </Pressable>
        </View>

        <View style={styles.rowButtons}>
          <Pressable style={styles.ghostButton} onPress={onAutoReview}>
            <AppText style={styles.ghostButtonText}>苦手単語から自動復習</AppText>
          </Pressable>
        </View>

        {quizScore !== null ? <AppText style={styles.scoreText}>スコア: {quizScore}/15</AppText> : null}
        {quizFeedback ? <AppText style={styles.feedbackText}>{quizFeedback}</AppText> : null}
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>AI添削例</AppText>
        <AppText style={styles.bodyText}>「もう少し具体例を入れるとわかりやすいです」</AppText>
      </View>
    </>
  );
}
